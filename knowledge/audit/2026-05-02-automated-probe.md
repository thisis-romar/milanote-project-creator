---
title: 2026-05-02 Automated Probe Session
description: Results of the first automated probe run using scripts/drive-probe-actions.mjs alongside the passive XHR capture CLI
version: 1.0.0
created: 2026-05-02T00:00:00Z
last_updated: 2026-05-02T00:00:00Z
---

# 2026-05-02 Automated Probe Session

## Overview

First automated probe session using the new `scripts/drive-probe-actions.mjs` Playwright driver
running concurrently with `npm run dev -- probe --duration 200`.

**App version captured:** `3.18.94`  
**User ID (redacted prefix):** `69e02074…`  
**Probe duration:** 200 seconds  
**Total XHR/fetch requests captured:** 18  
**Signal mutations (non-noise, POST/PUT/PATCH/DELETE, 2xx):** 1

## Gestures performed

All 5 create gestures succeeded. The driver uses **drag-from-toolbar** mechanics:

| Gesture | Tool class | Drop target | Succeeded | Element ID |
|---------|-----------|------------|-----------|------------|
| Drag note card | `element-tool-card` | canvas (400, 300) | YES | `1WjfGl1UBJED9i` |
| Drag link card | `element-tool-link` | canvas (600, 300) | YES | `1WjfGy1UBJED9j` |
| Drag checklist | `element-tool-task-list` | canvas (800, 300) | YES | `1WjfGF1UBJED9k` |
| Drag board card | `element-tool-board` | canvas (1000, 300) | YES | `1WjfGO1UBJED9m` |
| Drag column | `element-tool-column` | canvas (400, 500) | YES | `1WjfGY1UBJED9n` |
| Undo all (Ctrl+Z ×7) | keyboard | — | YES | — |

Self-cleaning: all gestures were undone via `Ctrl+Z` after the probe window closed.

## Signal mutations captured

### 1. `POST https://upload.milanote.com/api/link` — Link Preview

**Full details:** `knowledge/milanote/reference/api/link-preview.md`

This endpoint fetches URL metadata (title, description, og:image, provider) for newly-created
Link cards. It is a **side-effect** HTTP call triggered when the user drops a Link card and
types a URL; the actual element-create operation goes through WebSocket.

Request:
```json
{
  "url": "https://example.com",
  "elementId": "1WjfGy1UBJED9j",
  "environmentFolder": "p",
  "userId": "69e02074e309d50f749bc4f3",
  "locale": "en-au"
}
```

Response (200):
```json
{
  "image": {},
  "mediaType": "NO_MEDIA",
  "link": { "url": "https://example.com", "title": "Example Domain" },
  "elementType": "LINK",
  "description": "This domain is for use in documentation examples…",
  "provider": { "url": "https://example.com", "name": "example", "display": "example" }
}
```

## Key architectural finding: WebSocket routing

All element create/update/delete mutations are routed through a **WebSocket** to
`wss://collab.milanote.com`, **not** over XHR/fetch. The passive XHR probe therefore cannot
capture them.

Evidence: five elements were confirmed created in the DOM (visible in `id^="el-"` selectors and
New Relic `ins` action-tracking payloads) but zero create-mutation XHR calls appeared.

See: `knowledge/milanote/reference/api/collab-websocket.md`

## Noise filtered (discarded)

| Domain | Path pattern | Count | Category |
|--------|-------------|-------|----------|
| bam.nr-data.net | `/jserrors/…` | 7 | New Relic telemetry |
| bam.nr-data.net | `/ins/…` | 4 | New Relic user-action tracking |
| bam.nr-data.net | `/events/…` | 3 | New Relic events |
| static.milanote.com | `/awswaf/…` | 2 | AWS WAF bot-challenge |
| static.milanote.com | `/awswaf/inputs` | 1 | AWS WAF challenge input |

## Gaps and next steps

1. **WebSocket capture** — Extend `src/api/probe.ts` to listen on `page.on('websocket')`
   and capture `framesent`/`framereceived` events. This will reveal the collab protocol
   shapes for note, link, checklist, board, and column creates.

2. **Colour swatch** — Not attempted in this session (no toolbar tool with that exact label).
   The "More" toolbar item (`ToolbarPopupTool MoreTool`) may expose swatch/color via a popup.

3. **Link card URL input selector** — The link URL input was not filled by the driver in this
   session (the `waitForSelectorSafe` call timed out for the URL input). The element was still
   created (via WebSocket) and the link-preview HTTP call still fired because the initial URL
   came from the `https://example.com` string typed into the DOM. Future sessions should
   inspect the link card DOM more carefully to fill the URL input directly.

4. **Asset upload flow** — `POST https://upload.milanote.com/api/...` likely handles image
   and file uploads. Not yet probed.

5. **`__clientconf` server configuration captured:**
   - `apiRoot: ""` (relative, so `https://app.milanote.com` is the API host)
   - `mediaServer.apiUrl: "https://upload.milanote.com/api"`
   - `collaboration.url: "https://collab.milanote.com"`
   - `aws.s3Folder: "p"` (the `environmentFolder` value)

## Files updated

- `knowledge/milanote/reference/api/link-preview.md` — new
- `knowledge/milanote/reference/api/collab-websocket.md` — new
- `src/api/types.ts` — added `LinkPreviewRequestSchema`, `LinkPreviewResponseSchema`, `MilanoteElementIdSchema`
- `scripts/drive-probe-actions.mjs` — new (v1.1.0)
