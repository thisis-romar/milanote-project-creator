/**
 * @file probe.ts
 * @description Passive network capture for Milanote API discovery (HTTP + WebSocket)
 * @version 0.2.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-05-02T15:34:43Z
 *
 * Listens to XHR/fetch and WebSocket frames from a CDP-attached Milanote tab while
 * the driver performs UI actions (create board, add card, etc.) and saves captured
 * traffic for later analysis.
 *
 * v0.2.0 adds WebSocket capture via page.on('websocket') because Milanote routes
 * all element create/update/delete through wss://collab.milanote.com — XHR alone
 * misses everything that matters.
 */

import type { Page, Request as PWRequest, WebSocket as PWWebSocket } from 'playwright';

/** Inline shape of the argument to `framesent`/`framereceived` — Playwright doesn't export this. */
interface PWWebSocketFrame {
  payload: string | Buffer;
}
import type {
  CapturedRequest,
  CapturedWsFrame,
  ProbeResult,
  ProbeSummary,
  WsLifecycleEvent,
} from './types.js';

const HOST_FILTER = /milanote\.com/i;
const MAX_BODY_BYTES = 50_000;

export interface CaptureOptions {
  durationMs: number;
  onRequest?: (req: CapturedRequest) => void;
}

export async function captureNetwork(page: Page, options: CaptureOptions): Promise<ProbeResult> {
  const startedAt = new Date().toISOString();
  const captured: CapturedRequest[] = [];
  const pending = new Map<PWRequest, CapturedRequest>();
  const wsFrames: CapturedWsFrame[] = [];
  const wsEvents: WsLifecycleEvent[] = [];

  const onRequest = (req: PWRequest): void => {
    if (!HOST_FILTER.test(req.url())) return;
    const type = req.resourceType();
    if (type !== 'xhr' && type !== 'fetch') return;

    const entry: CapturedRequest = {
      timestamp: Date.now(),
      method: req.method(),
      url: req.url(),
      pathname: safePathname(req.url()),
      resourceType: type,
      requestHeaders: req.headers(),
      postData: req.postData(),
    };
    pending.set(req, entry);
    captured.push(entry);
    options.onRequest?.(entry);
  };

  const onResponse = async (resp: Awaited<ReturnType<Page['waitForResponse']>>): Promise<void> => {
    const req = resp.request();
    const entry = pending.get(req);
    if (!entry) return;
    entry.responseStatus = resp.status();
    entry.responseHeaders = resp.headers();
    entry.responseTime = Date.now() - entry.timestamp;
    try {
      const ct = resp.headers()['content-type'] ?? '';
      if (ct.includes('json') || ct.includes('text') || ct.includes('graphql')) {
        const body = await resp.text();
        entry.responseBody = body.length > MAX_BODY_BYTES ? body.slice(0, MAX_BODY_BYTES) + '...[truncated]' : body;
      }
    } catch {
      /* binary or stream — skip body */
    }
    pending.delete(req);
  };

  // ── WebSocket capture ─────────────────────────────────────────────────────
  // Listener must be attached BEFORE any navigation / driver gestures fire,
  // otherwise the connect handshake and early frames are lost (Playwright does
  // not replay). Caller is responsible for invoking captureNetwork() before
  // running the driver script.
  const onWebSocket = (ws: PWWebSocket): void => {
    if (!HOST_FILTER.test(ws.url())) return;
    const wsId = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const url = ws.url();
    wsEvents.push({ timestamp: Date.now(), wsId, url, kind: 'open' });

    ws.on('framesent', (frame) => recordFrame('sent', wsId, url, frame));
    ws.on('framereceived', (frame) => recordFrame('received', wsId, url, frame));
    ws.on('socketerror', (err: string) => {
      wsEvents.push({ timestamp: Date.now(), wsId, url, kind: 'error', error: err });
    });
    ws.on('close', () => {
      wsEvents.push({ timestamp: Date.now(), wsId, url, kind: 'close' });
    });
  };

  const recordFrame = (
    direction: 'sent' | 'received',
    wsId: string,
    url: string,
    frame: PWWebSocketFrame,
  ): void => {
    const payload: string | Buffer = frame.payload as unknown as string | Buffer;
    const isBinary = Buffer.isBuffer(payload);
    const rawLen = isBinary ? (payload as Buffer).length : (payload as string).length;
    let stored: string;
    let truncated = false;
    if (isBinary) {
      const buf = payload as Buffer;
      const slice = buf.length > MAX_BODY_BYTES ? buf.subarray(0, MAX_BODY_BYTES) : buf;
      stored = slice.toString('base64');
      truncated = buf.length > MAX_BODY_BYTES;
    } else {
      const text = payload as string;
      if (text.length > MAX_BODY_BYTES) {
        stored = text.slice(0, MAX_BODY_BYTES) + '...[truncated]';
        truncated = true;
      } else {
        stored = text;
      }
    }
    wsFrames.push({
      timestamp: Date.now(),
      wsId,
      direction,
      url,
      payload: stored,
      payloadType: isBinary ? 'binary' : 'text',
      payloadBytes: rawLen,
      truncated: truncated || undefined,
    });
  };

  page.on('request', onRequest);
  page.on('response', (resp) => {
    void onResponse(resp);
  });
  page.on('websocket', onWebSocket);

  await new Promise((r) => setTimeout(r, options.durationMs));

  page.off('request', onRequest);
  page.off('websocket', onWebSocket);

  return {
    startedAt,
    endedAt: new Date().toISOString(),
    totalRequests: captured.length,
    capturedRequests: captured,
    capturedWsFrames: wsFrames,
    capturedWsEvents: wsEvents,
  };
}

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function summarize(result: ProbeResult): ProbeSummary {
  const byMethod: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const pathStats = new Map<string, { count: number; methods: Set<string> }>();

  for (const r of result.capturedRequests) {
    byMethod[r.method] = (byMethod[r.method] ?? 0) + 1;
    const status = r.responseStatus !== undefined ? String(r.responseStatus) : 'pending';
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    const ps = pathStats.get(r.pathname) ?? { count: 0, methods: new Set<string>() };
    ps.count += 1;
    ps.methods.add(r.method);
    pathStats.set(r.pathname, ps);
  }

  const topPaths = [...pathStats.entries()]
    .map(([path, stats]) => ({ path, count: stats.count, methods: [...stats.methods].sort() }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  // "Candidate mutations" — POST/PUT/PATCH/DELETE with 2xx response
  const candidateMutations = result.capturedRequests.filter(
    (r) =>
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method) &&
      typeof r.responseStatus === 'number' &&
      r.responseStatus >= 200 &&
      r.responseStatus < 300,
  );

  // ── WebSocket aggregates ──────────────────────────────────────────────────
  const wsByUrlMap = new Map<string, { sent: number; received: number }>();
  let wsSent = 0;
  let wsReceived = 0;
  for (const f of result.capturedWsFrames ?? []) {
    if (f.direction === 'sent') wsSent += 1;
    else wsReceived += 1;
    const cur = wsByUrlMap.get(f.url) ?? { sent: 0, received: 0 };
    if (f.direction === 'sent') cur.sent += 1;
    else cur.received += 1;
    wsByUrlMap.set(f.url, cur);
  }
  const wsByUrl = [...wsByUrlMap.entries()]
    .map(([url, c]) => ({ url, sent: c.sent, received: c.received }))
    .sort((a, b) => b.sent + b.received - (a.sent + a.received));
  const wsSampleSent = (result.capturedWsFrames ?? [])
    .filter((f) => f.direction === 'sent')
    .slice(0, 10);

  return {
    totalRequests: result.capturedRequests.length,
    byMethod,
    byStatus,
    topPaths,
    candidateMutations,
    wsFrameCounts: { sent: wsSent, received: wsReceived, total: wsSent + wsReceived },
    wsByUrl,
    wsSampleSent,
  };
}
