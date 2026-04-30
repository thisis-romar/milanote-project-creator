---
title: Handling Rate Limits
description: Token-bucket strategy for Milanote API calls, 429 backoff, 5xx retry
version: 1.0.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# Handling Rate Limits

`MilanoteClient` (`src/api/client.ts`) wraps every API call in a token-bucket rate limiter and an automatic backoff for 429/5xx. Callers should NOT add their own delays.

## Default policy

| Knob | Default | Why |
|------|---------|-----|
| Bucket capacity | 3 | Allows a small burst (create board + add column + add card) without throttling |
| Refill rate | 1 token/second | Sustained 1 req/s long-term — conservative until probe shows headroom |
| 429 retry | `Retry-After` header (default 1s) | Respect server's hint; recurse the same call |
| 5xx retry | 2s sleep, recursive | Single retry to ride out transient blips |

## Tuning

Pass a custom rate-limit policy at client construction:

```ts
const client = new MilanoteClient(cookies, {
  rateLimit: { capacity: 6, perSecond: 2 },
});
```

Higher capacity = more burst before throttling. Higher `perSecond` = more sustained throughput. Be conservative: hitting Milanote's true rate limit ⤳ they may temporarily ban the cookie or trigger Cloudflare challenge, both of which kill the session.

## Symptoms of overrun

| Symptom | Meaning | Fix |
|---|---|---|
| Repeated 429 with growing `Retry-After` | Server is exponentially backing us off | Lower `perSecond` |
| 403 with Cloudflare HTML body | Cloudflare bot challenge tripped | Slow down, randomize timing, ensure real UA, use the live Edge cookie via CDP (don't construct a fresh fetch) |
| 401 mid-session | Session cookie invalidated | Re-attach via CDP — user may need to refresh Milanote tab |
| 5xx persisting | Genuine outage | Stop, don't hammer; check status.milanote.com |

## During bulk creates

When creating a large board (many cards), the orchestrator (`src/creator/orchestrator.ts`) calls the client serially. Token bucket throttles between calls automatically — no parallelism is attempted, by design. Parallel mutations to the same board would also race in the UI, since Milanote uses optimistic updates.

If a template has 50+ cards and goes faster than your `perSecond`, the user will see a slow-but-steady creation. That's intentional.

## Logging

The client does not log request bodies. Cookies are never logged. `console.log` is OK for status/path/duration, but always strip request bodies before writing to disk (audit reports etc.).

## Source

Token bucket pattern ported from `claude-conversation-reader/src/api/client.ts:23-99`. Same defaults proven in production for Claude.ai's internal API.
