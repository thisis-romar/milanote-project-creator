---
title: Collaboration WebSocket (collab.milanote.com)
description: All element create/update/delete mutations go through a WebSocket connection to wss://collab.milanote.com — not HTTP
version: 1.0.0
created: 2026-05-02T00:00:00Z
last_updated: 2026-05-02T00:00:00Z
---

# Collaboration WebSocket

## Connection

`wss://collab.milanote.com`

Configured in `window.__clientconf.collaboration.url` on the Milanote SPA page.

## Role

All board mutation operations — creating cards, columns, boards, to-do lists, etc. — are sent
over this persistent WebSocket connection, **not** over HTTP XHR/fetch. This is why a passive
XHR probe captures no create/update/delete calls for most Milanote primitives.

## Observed evidence

During the automated probe session (`2026-05-02-automated-probe`), five gestures were
performed that successfully created elements on the canvas:

| Gesture | Element ID | Class |
|---------|-----------|-------|
| Drag note card | `1WjfGl1UBJED9i` | `Card` |
| Drag link card | `1WjfGy1UBJED9j` | `Link` |
| Drag checklist | `1WjfGF1UBJED9k` | `TaskList` + child `Task` |
| Drag board | `1WjfGO1UBJED9m` | `Board` |
| Drag column | `1WjfGY1UBJED9n` | `Column` |

All five elements appeared in the DOM with IDs assigned (confirmed by New Relic `ins` action
tracking payloads) but no HTTP mutation calls were captured — confirming the WebSocket routing.

Only the **link URL-preview call** (`POST https://upload.milanote.com/api/link`) fired over
HTTP, because it is a side-effect metadata fetch, not the actual element create.

## Next steps

To capture the collab WebSocket protocol:

1. Extend the probe to also intercept `WebSocket` frames via Playwright's `page.on('websocket')`
   event and the frame-level `ws.on('framesent')` / `ws.on('framereceived')` listeners.
2. Each frame is likely a JSON or binary-encoded operation describing the mutation
   (element type, parent board ID, position, initial data).
3. Capturing a create frame will reveal the exact payload schema needed for `src/api/types.ts`
   and the `ApiCreator` implementation.

## Implications for ApiCreator

The `ApiCreator` in `src/api/` cannot use plain `MilanoteClient.postJson()` to create elements.
It must either:
- Open a WebSocket to `wss://collab.milanote.com` and send the appropriate frames, OR
- Rely entirely on the `UiCreator` Playwright path (which naturally triggers the WebSocket
  by performing real UI actions).

The `UiCreator` drag-based approach is therefore the **confirmed working path** for element
creation as of app version `3.18.94`.
