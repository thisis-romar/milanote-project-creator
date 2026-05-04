/**
 * @file attach.ts
 * @description Attach to the user's live Edge instance via CDP and return a Playwright Browser
 * @version 1.0.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import { chromium, type Browser } from 'playwright';
import WebSocket from 'ws';
import type { Cookie } from 'playwright';
import { CDP_PORT, launchEdgeWithCDP, waitForCDP } from './edge.js';

export async function attachToEdge(initialUrl = 'about:blank'): Promise<Browser> {
  await launchEdgeWithCDP(initialUrl);
  await waitForCDP();

  // With many open Edge tabs, connecting at the browser level enumerates all targets
  // and can time out. Instead, locate the Milanote page target first (one fast HTTP call),
  // then connect directly to that page's WebSocket URL — bypasses full-browser enumeration.
  try {
    const targets: Array<{ type: string; url?: string; webSocketDebuggerUrl?: string }> =
      await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json());
    const milanotePage = targets.find((t) => t.type === 'page' && t.url?.includes('milanote.com'));
    if (milanotePage?.webSocketDebuggerUrl) {
      const browser = await chromium.connectOverCDP(milanotePage.webSocketDebuggerUrl, { timeout: 30_000 });
      return browser;
    }
  } catch {
    // Fall through to browser-level connect
  }

  // Fallback: browser-level connect (slow with many tabs but always works eventually)
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`, { timeout: 120_000 });
  return browser;
}

/** Extract Milanote cookies and userId directly via CDP — bypasses Playwright browser-level connect.
 *  Chrome cookies are browser-wide so any open tab's WebSocket can be used for extraction. */
export async function getCookiesViaCDP(): Promise<{ cookies: Cookie[]; userId: string }> {
  const targets = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then(
    (r) => r.json() as Promise<Array<{ type: string; url?: string; webSocketDebuggerUrl?: string }>>,
  );
  // Prefer the Milanote tab; fall back to any available page tab (cookies are browser-scoped)
  const page =
    targets.find((t) => t.type === 'page' && t.url?.includes('milanote.com')) ??
    targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page?.webSocketDebuggerUrl) throw new Error('No page targets found in Edge — open Edge first');

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(page.webSocketDebuggerUrl!);
    let msgId = 1;
    const pending = new Map<number, (m: Record<string, unknown>) => void>();

    ws.on('message', (raw) => {
      const m = JSON.parse(raw.toString()) as { id?: number; result?: Record<string, unknown> };
      if (m.id && pending.has(m.id)) { pending.get(m.id)!(m as Record<string, unknown>); pending.delete(m.id); }
    });

    const send = (method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> =>
      new Promise((res, rej) => {
        const i = msgId++;
        pending.set(i, res);
        ws.send(JSON.stringify({ id: i, method, params }));
        setTimeout(() => { pending.delete(i); rej(new Error(method)); }, 8000);
      });

    ws.once('open', async () => {
      try {
        await send('Network.enable');
        const cr = await send('Network.getCookies', { urls: ['https://app.milanote.com'] }) as {
          result?: { cookies?: Array<{ name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite: string }> };
        };
        ws.close();
        const rawCookies = (cr.result?.cookies ?? []) as Cookie[];
        const milanoteCookies = rawCookies.filter((c: Cookie) => c.domain?.includes('milanote.com'));
        const otParams = milanoteCookies.find((c: Cookie) => c.name === 'mn-ot-data-subject-params');
        let userId = '';
        if (otParams) {
          try { userId = (JSON.parse(decodeURIComponent(otParams.value)) as { id?: string }).id ?? ''; } catch { /* */ }
        }
        resolve({ cookies: milanoteCookies, userId });
      } catch (err) {
        ws.close();
        reject(err);
      }
    });

    ws.once('error', (err) => { ws.close(); reject(err); });
  });
}
