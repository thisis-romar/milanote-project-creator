---
title: Discovering the Milanote API
description: How to use `milanote-creator probe` to passively capture XHR/fetch traffic and identify candidate create/update endpoints
version: 1.0.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# Discovering the Milanote API

Milanote does not publish a public API. We discover its internal endpoints by attaching to the user's live Edge browser via CDP and observing the XHR/fetch traffic that the Milanote SPA makes while a real user performs actions.

## Why this approach

- **No reverse-engineering of bundled JS** — observe runtime behavior, not minified source.
- **Cookies are already valid** — the user is logged in to Milanote in their Edge profile; we don't replay auth.
- **Cloudflare-friendly** — traffic comes from the real Edge instance, not a headless bot.

## The `probe` command

```bash
npm run dev probe -- --duration 120
```

| Flag | Default | What it does |
|------|---------|--------------|
| `-d, --duration <seconds>` | `120` | how long to capture |
| `-o, --out <file>` | `.ms-debug/probe-<ts>.json` | output JSON path |
| `-u, --url <url>` | `https://app.milanote.com` | URL to load if no Milanote tab is open |

The command attaches to your Edge instance, opens Milanote, then listens to every XHR/fetch on `*.milanote.com` for the duration. **Perform real actions in your Milanote workspace during the capture window** — create a board, add a column, add cards of every type, upload an image, nest a board. Each action drives one or more API calls that get captured.

When the timer expires, the tool dumps:

1. **Full JSON** to `.ms-debug/probe-<ts>.json` — every captured request with method, URL, headers, body, status, response body (truncated at 50 KB).
2. **Console summary** — counts by method, counts by status, top 15 paths, and a list of "candidate mutations" (POST/PUT/PATCH/DELETE that returned 2xx).

## Interpreting the output

### What's signal vs noise

- **Signal:** `POST`/`PUT`/`PATCH` to paths under `/api/`, `/graphql`, or `/gql/` returning 2xx. These are the create/update operations.
- **Noise:** GETs (mostly read-side), telemetry (`/track`, `/analytics`, `/segment`), auth refreshes (`/auth/refresh`).

### Per-primitive mapping

<!-- derived from: knowledge/milanote/reference/elements/INDEX.md -->
<!-- The primitives listed here mirror the v0 primitive set defined in reference/elements/INDEX.md. -->
<!-- If you add a new primitive there, add a row here too. -->

For the v0 supported primitives, expect to see these mutations during a probe session:

| User action | Expected captured calls |
|-------------|--------------------------|
| Create board | 1 mutation creating the board node + possibly 1 mutation linking it to a parent |
| Add column to board | 1 mutation |
| Add note card | 1 mutation |
| Add link card | 1 mutation (may include a synchronous URL-preview fetch) |
| Add image card | upload (multipart or signed URL flow) + 1 element-create mutation |
| Add swatch card | 1 mutation |
| Add checklist card | 1 mutation; each subsequent item may be a separate PUT |
| Add file card | upload (same flow as image) + 1 element-create mutation |
| Nest a board | board-create mutation with a parent ID parameter, OR board-create + a separate move/link call |

## Output convention

Every probe session produces a JSON snapshot. Promote findings to:

- **`knowledge/milanote/reference/api/<endpoint-name>.md`** — one doc per endpoint with: URL pattern, method, request shape, response shape, observed status codes, error shapes
- **`knowledge/audit/<YYYY-MM-DD>-probe-<topic>.md`** — dated audit of what the probe session covered and what gaps remain
- **`src/api/types.ts`** — Zod schemas for confirmed endpoint shapes

Then run `/graphify knowledge/milanote knowledge/audit` to refresh the brain.

## Active replay (future)

The probe is currently passive. A follow-up `probe-replay` command will:

1. Read a captured request from a probe JSON
2. Construct a self-cleaning harness — create a probe board, replay the captured mutation against it, verify the response, then delete the probe board
3. Confirm the endpoint is parameterizable (rename the board, modify the body) and idempotent

This mirrors the `probe-project-api` pattern from `claude-conversation-reader/src/index.ts:719-843`.

## Constraints

- Do not commit `.ms-debug/probe-*.json` — they may contain workspace IDs and auth cookies. The directory is in `.gitignore`.
- Sanitize before sharing: redact `Cookie` headers, `Authorization` headers, and `csrf` tokens before pasting in audit reports.
