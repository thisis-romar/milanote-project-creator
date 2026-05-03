/**
 * @file client.test.ts
 * @description Tests for TokenBucket, buildCookieHeader, and MilanoteClient HTTP methods
 * @version 0.1.0
 * @created 2026-05-03T00:00:00Z
 * @lastUpdated 2026-05-03T00:00:00Z
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenBucket, buildCookieHeader, MilanoteClient } from './client.js';
import type { Cookie } from 'playwright';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const makeCookies = (): Cookie[] => [
  { name: 'session', value: 'abc123', domain: 'app.milanote.com', path: '/', expires: -1, httpOnly: true, secure: true, sameSite: 'Lax' },
  { name: 'pref', value: 'dark', domain: 'milanote.com', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' },
];

const okJson = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

// ── buildCookieHeader ────────────────────────────────────────────────────────

describe('buildCookieHeader', () => {
  it('joins cookies as name=value pairs with "; " separator', () => {
    expect(buildCookieHeader(makeCookies())).toBe('session=abc123; pref=dark');
  });

  it('returns empty string for empty array', () => {
    expect(buildCookieHeader([])).toBe('');
  });

  it('handles single cookie', () => {
    const [c] = makeCookies();
    expect(buildCookieHeader([c])).toBe('session=abc123');
  });
});

// ── TokenBucket ──────────────────────────────────────────────────────────────

describe('TokenBucket', () => {
  it('resolves immediately when bucket is full', async () => {
    const bucket = new TokenBucket(5, 1);
    const start = Date.now();
    await bucket.take();
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('resolves immediately for take(n) within capacity', async () => {
    const bucket = new TokenBucket(5, 1);
    const start = Date.now();
    await bucket.take(3);
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('waits when tokens are exhausted (low refill rate)', async () => {
    const bucket = new TokenBucket(1, 50); // refills at 50/s — 1 token in 20ms
    await bucket.take(1); // drain to 0
    const start = Date.now();
    await bucket.take(1); // should wait ~20ms
    expect(Date.now() - start).toBeGreaterThanOrEqual(10);
  });
});

// ── MilanoteClient ───────────────────────────────────────────────────────────

describe('MilanoteClient.getJson', () => {
  const cookies = makeCookies();
  // Use a high-capacity bucket to avoid rate-limit delays in tests
  const fastOpts = { rateLimit: { capacity: 20, perSecond: 100 } };

  it('sends Cookie header from provided cookies', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ ok: true }));
    const client = new MilanoteClient(cookies, fastOpts);
    await client.getJson('/api/test');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Headers }];
    expect((init.headers as Headers).get('cookie')).toBe('session=abc123; pref=dark');
  });

  it('prepends baseUrl to relative paths', async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const client = new MilanoteClient(cookies, fastOpts);
    await client.getJson('/api/elements');

    expect(mockFetch.mock.calls[0][0]).toBe('https://app.milanote.com/api/elements');
  });

  it('uses an absolute URL directly when path starts with http', async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const client = new MilanoteClient(cookies, fastOpts);
    await client.getJson('https://cdn.example.com/image.png');

    expect(mockFetch.mock.calls[0][0]).toBe('https://cdn.example.com/image.png');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });
    const client = new MilanoteClient(cookies, fastOpts);
    await expect(client.getJson('/api/missing')).rejects.toThrow('404');
  });

  it('retries once on 429 and returns the second response', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'retry-after': '0' }),
      })
      .mockResolvedValueOnce(okJson({ retried: true }));

    const client = new MilanoteClient(cookies, fastOpts);
    const result = await client.getJson<{ retried: boolean }>('/api/test');
    expect(result.retried).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries once on 5xx and returns the second response', async () => {
    vi.useFakeTimers();
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable', headers: new Headers() })
      .mockResolvedValueOnce(okJson({ recovered: true }));

    const client = new MilanoteClient(cookies, fastOpts);
    const p = client.getJson<{ recovered: boolean }>('/api/test');
    await vi.advanceTimersByTimeAsync(2100);
    const result = await p;
    expect(result.recovered).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('MilanoteClient.postJson', () => {
  const cookies = makeCookies();
  const fastOpts = { rateLimit: { capacity: 20, perSecond: 100 } };

  it('sends a POST request with JSON body', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ created: true }));
    const client = new MilanoteClient(cookies, fastOpts);
    await client.postJson('/api/elements', { type: 'BOARD', title: 'Test' });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Headers }];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ type: 'BOARD', title: 'Test' }));
    expect((init.headers as Headers).get('content-type')).toBe('application/json');
  });

  it('throws on non-ok response and includes status in message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => 'not allowed',
    });
    const client = new MilanoteClient(cookies, fastOpts);
    await expect(client.postJson('/api/elements', {})).rejects.toThrow('403');
  });
});
