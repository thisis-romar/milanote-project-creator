---
title: Initial API Probe — 2026-04-29
description: Stub for Phase 2 endpoint discovery results. To be filled after running `milanote-creator probe` against a live Milanote session.
version: 0.1.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# Initial API Probe — 2026-04-29

**Status:** Stub — Phase 2 not yet complete.

## To fill in after running `milanote-creator probe`

- Which create-board endpoint shape worked (if any)
- Request shape (URL, method, headers, body)
- Response shape (board ID, workspace ID, etc.)
- Cloudflare behavior (blocked? passed?)
- Per-primitive endpoint shapes (create column, create card by type)
- Fallback decision: which operations went to UI driver vs API

## Probe variants to test

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/boards` | POST | pending |
| `/api/v1/boards` | POST | pending |
| `/api/workspaces/:id/boards` | POST | pending |
| GraphQL `createBoard` mutation | POST | pending |
| Per-primitive (column, note, image, swatch, checklist, link) | POST | pending |
