---
title: Initial API Probe — 2026-04-29
description: Stub for Phase 2 endpoint discovery results. To be filled after running `milanote-creator probe` against a live Milanote session.
version: 0.1.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# Initial API Probe — 2026-04-29

**Status:** Tooling ready — awaiting first probe session.

The `milanote-creator probe` command (`src/commands/probe.ts`) is built and ready to capture XHR/fetch traffic from a live Milanote session. See playbook: [knowledge/milanote/playbooks/discovering-the-api.md](../milanote/playbooks/discovering-the-api.md).

To run:
```bash
npm run dev probe -- --duration 180
```
Then perform create-board / add-column / add-card actions of every primitive type in the Edge window during the capture window.

## To fill in after running `milanote-creator probe`

- Which create-board endpoint shape worked (if any)
- Request shape (URL, method, headers, body)
- Response shape (board ID, workspace ID, etc.)
- Cloudflare behavior (blocked? passed?)
- Per-primitive endpoint shapes (create column, create card by type)
- Fallback decision: which operations went to UI driver vs API

## Probe variants to test

<!-- derived from: knowledge/milanote/reference/elements/INDEX.md -->
<!-- This table mirrors the v0 primitive set. If a new primitive is added to the INDEX, add it here too. -->

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/boards` | POST | pending |
| `/api/v1/boards` | POST | pending |
| `/api/workspaces/:id/boards` | POST | pending |
| GraphQL `createBoard` mutation | POST | pending |
| Per-primitive (column, note, image, file, swatch, checklist, link, nested board) | POST | pending |
| Workspace list (for `workspaces` command) | GET | pending |
