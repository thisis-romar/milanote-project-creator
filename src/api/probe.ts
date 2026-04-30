/**
 * @file probe.ts
 * @description Passive network capture for Milanote API discovery
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 *
 * Listens to all XHR/fetch requests from a CDP-attached Milanote tab while the
 * user performs UI actions (create board, add card, etc.) and saves the captured
 * traffic for later analysis. Inspired by claude-conversation-reader's
 * probe-project-api:719-843 but passive — does not yet replay or mutate.
 */

import type { Page, Request as PWRequest } from 'playwright';
import type { CapturedRequest, ProbeResult, ProbeSummary } from './types.js';

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

  page.on('request', onRequest);
  page.on('response', (resp) => {
    void onResponse(resp);
  });

  await new Promise((r) => setTimeout(r, options.durationMs));

  page.off('request', onRequest);

  return {
    startedAt,
    endedAt: new Date().toISOString(),
    totalRequests: captured.length,
    capturedRequests: captured,
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

  return {
    totalRequests: result.capturedRequests.length,
    byMethod,
    byStatus,
    topPaths,
    candidateMutations,
  };
}
