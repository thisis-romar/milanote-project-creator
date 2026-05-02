/**
 * @file client.ts
 * @description Rate-limited HTTP client for Milanote — uses cookies extracted from CDP-attached Edge
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 *
 * Token bucket pattern lifted from claude-conversation-reader/src/api/client.ts:23-99.
 * Used by Phase 4 once the probe (Phase 2) discovers actual endpoints.
 */

import type { BrowserContext, Cookie } from 'playwright';

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async take(n = 1): Promise<void> {
    this.refill();
    while (this.tokens < n) {
      const waitMs = Math.ceil(((n - this.tokens) / this.refillPerSecond) * 1000);
      await new Promise((r) => setTimeout(r, waitMs));
      this.refill();
    }
    this.tokens -= n;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSecond);
    this.lastRefill = now;
  }
}

export function buildCookieHeader(cookies: Cookie[]): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

export async function getMilanoteCookies(context: BrowserContext): Promise<Cookie[]> {
  const all = await context.cookies();
  return all.filter((c) => c.domain.includes('milanote.com'));
}

export interface ClientOptions {
  baseUrl?: string;
  userAgent?: string;
  rateLimit?: { capacity: number; perSecond: number };
}

export class MilanoteClient {
  private readonly bucket: TokenBucket;
  private readonly baseUrl: string;
  private readonly userAgent: string;

  constructor(
    private readonly cookies: Cookie[],
    options: ClientOptions = {},
  ) {
    this.baseUrl = options.baseUrl ?? 'https://app.milanote.com';
    this.userAgent = options.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0';
    const rl = options.rateLimit ?? { capacity: 3, perSecond: 1 };
    this.bucket = new TokenBucket(rl.capacity, rl.perSecond);
  }

  async request(path: string, init: RequestInit = {}): Promise<Response> {
    await this.bucket.take();
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const headers = new Headers(init.headers);
    headers.set('cookie', buildCookieHeader(this.cookies));
    headers.set('user-agent', this.userAgent);
    if (!headers.has('accept')) headers.set('accept', 'application/json, text/plain, */*');

    const resp = await fetch(url, { ...init, headers });
    if (resp.status === 429) {
      const retryAfter = Number(resp.headers.get('retry-after') ?? 1);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return this.request(path, init);
    }
    if (resp.status >= 500 && resp.status < 600) {
      await new Promise((r) => setTimeout(r, 2000));
      return this.request(path, init);
    }
    return resp;
  }

  async getJson<T = unknown>(path: string): Promise<T> {
    const resp = await this.request(path);
    if (!resp.ok) throw new Error(`GET ${path} failed: ${resp.status} ${resp.statusText}`);
    return resp.json() as Promise<T>;
  }

  async postJson<T = unknown>(path: string, body: unknown): Promise<T> {
    const resp = await this.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`POST ${path} failed: ${resp.status} ${resp.statusText}${text ? ` — ${text.slice(0, 300)}` : ''}`);
    }
    return resp.json() as Promise<T>;
  }
}
