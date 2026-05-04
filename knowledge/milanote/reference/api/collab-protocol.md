---
title: Milanote Collab WebSocket Protocol
description: Socket.IO protocol on wss://app.milanote.com/socket.io/ — carries all element create/update/delete mutations
version: 1.0.0
created: 2026-05-02T16:08:54Z
last_updated: 2026-05-02T16:08:54Z
---

<!-- source: knowledge/audit/2026-05-02-automated-probe.md -->

# Milanote Collab WebSocket Protocol

## Transport

| Field | Value |
|---|---|
| URL | `wss://app.milanote.com/socket.io/?userId=<userId>&EIO=4&transport=websocket` |
| Protocol | **Socket.IO v4** (Engine.IO 4) over WebSocket |
| Observed port | 443 (WSS) |

> Note: The collaboration server config in `window.__clientconf` shows `https://collab.milanote.com` as the `collaboration.url`, but actual traffic goes to `wss://app.milanote.com/socket.io/`. The two appear to be the same origin via reverse proxy.

## Socket.IO framing

Socket.IO v4 prefix codes:

| Prefix | Meaning |
|---|---|
| `40` | Connect confirmation |
| `42N[...]` | EVENT (N = sequential message ID) |
| `3` | Heartbeat pong |

All mutation payloads are `42N["action", { ... }]` events.

## ELEMENT_CREATE — Board (BOARD)

Derived from `src/api/creator.ts` (createRootBoard + createSubboard) and `src/api/collab-socket.ts`. The shape is symmetric with all other ELEMENT_CREATE types; the unique constraint is the **3-second post-create wait** before sending children.

```json
42N["action", {
  "type": "ELEMENT_CREATE",
  "elementType": "BOARD",
  "id": "<client-generated-14-char-id>",
  "location": {
    "parentId": "<parent-board-id>",
    "section": "CANVAS",
    "position": { "x": 50, "y": 50, "score": 65536 }
  },
  "content": {
    "title": "<string>",
    "description": "<string>"
  },
  "meta": {
    "creator": "<userId>",
    "modifiedBy": "<userId>",
    "createdTime": 1777752108018,
    "modifiedTime": 1777752108018,
    "platform": "Desktop web",
    "locationSectionModifiedTime": 1777752108018,
    "versionId": "<sessionId>-N"
  },
  "timestamp": 1777752108018,
  "sync": true,
  "user": { "_id": "<userId>", "clientId": "<clientId>", "clientTick": N },
  "deviceId": "<deviceId>",
  "sessionId": "<sessionId>",
  "channels": ["<parentBoardId>-LIVE"]
}]
```

**Critical timing:** after sending ELEMENT_CREATE for a BOARD, the client must wait **~3 seconds** for the server to register the new board as a live channel before sending any `ELEMENT_CREATE` messages with `location.parentId` set to the new board ID. Sending children too early silently drops them. Root boards require 3s; nested subboards require 2s.

## ELEMENT_CREATE — Note card (CARD)

```json
42N["action", {
  "type": "ELEMENT_CREATE",
  "elementType": "CARD",
  "id": "<new-element-id>",
  "location": {
    "parentId": "<board-id>",
    "section": "CANVAS",
    "position": { "x": 39, "y": 29, "score": 196608 }
  },
  "content": {
    "textContent": null
  },
  "meta": {
    "creator": "<userId>",
    "modifiedBy": "<userId>",
    "createdTime": 1777752108018,
    "modifiedTime": 1777752108018,
    "platform": "Desktop web",
    "locationSectionModifiedTime": 1777752108018,
    "versionId": "<sessionId>-1"
  },
  "timestamp": 1777752108018,
  "sync": true,
  "creationSource": "...",
  "user": { "_id": "<userId>", "clientId": "<clientId>", "clientTick": 97 },
  "deviceId": "<deviceId>",
  "sessionId": "<sessionId>",
  "channels": ["<boardId>-LIVE"]
}]
```

## ELEMENT_CREATE — Link card (LINK)

Same shape as CARD with:
```json
"elementType": "LINK",
"content": { "url": null }
```

## ELEMENT_CREATE — Checklist (TASK_LIST + TASK)

Creating a checklist fires **two** `ELEMENT_CREATE` messages in sequence:

**1. The list container:**
```json
"elementType": "TASK_LIST",
"content": { "title": null, "showTitle": false }
```

**2. The first task item (child of the list):**
```json
"elementType": "TASK",
"location": {
  "parentId": "<task-list-id>",
  "section": "INBOX",
  "position": { "index": 0, "score": 0 }
},
"content": { "textContent": null }
```

## Other observed action types

| Type | When |
|---|---|
| `USER_NAVIGATE` | Board load / navigation |
| `ELEMENTS_SELECTED` | Element clicked/focused |
| `ELEMENTS_DESELECT_ALL` | Click away |
| `ELEMENT_SET_TYPE` | Type change on existing element |
| `ELEMENT_DELETE` | Ctrl+Z undo (delete after undo of create) |

## ID format

Element IDs follow the pattern observed in the DOM: alphanumeric strings like `1Wjgx61gZSco1y` (~14 chars). They are assigned **client-side** before the socket message is sent — the client generates the ID, not the server.

The ID encodes `<sessionId><clientTick><suffix>` — e.g. `1gZSco` is the `clientId` field from the user object.

## Template board content — access limitation (probed 2026-05-03)

Milanote's 165+ official template boards (see `reference/templates/template-board-ids.json`) are server-side protected. Extensive probing confirmed all paths fail:

| Approach | Result |
|---|---|
| `GET /api/elements?ids=<templateId>&includeChildren=true` | Returns `{BOARD:1, SKELETON:4}` only — placeholders, no content |
| `GET /api/boards?ids=<templateId>` | Same: SKELETON only |
| Direct URL navigation `app.milanote.com/<templateId>` | Redirects to a Milanote feature page, not the board |
| Socket.IO `USER_NAVIGATE + update-channels(replay:true)` | 0 `ELEMENT_CREATE` frames received — server does not replay to external clients |
| CDP `Network.webSocketFrameReceived` | Does not fire after `Page.navigate` (session disconnect during reload) |
| `Page.addScriptToEvaluateOnNewDocument` WebSocket hook | Hook runs, but `window.__wsMessages` stays empty — SPA may use service worker or different context |
| Browser "Use this template" via CDP automation | `POST /api/elements/duplicate` fires but returns error: "Couldn't duplicate this content" — template source boards are Milanote-owned and protected |

**Conclusion:** Template content is only materialised server-side when Milanote's own backend executes the duplication with elevated permissions. Regular API access (including authenticated Socket.IO) cannot read or replicate template element data.

The SKELETON element type is Milanote's lazy-loading sentinel: 4 SKELETON children per template board, visible via REST but containing no content fields. The actual cards, columns, and text exist only in Milanote's internal data store.

The `POST /api/elements/duplicate` endpoint *does* exist and is used by the template picker flow. Its shape:
```json
POST /api/elements/duplicate
{
  "duplications": [{
    "originalElementId": "<milanote-template-source-board-id>",
    "newElementId": "<user-destination-board-id>",
    "newElementLocation": {
      "parentId": "<workspace-board-id>",
      "position": { "x": 50, "y": 50, "score": 65536 }
    }
  }]
}
```
The `originalElementId` is a Milanote-owned board (not the same ID as in `template-board-ids.json` — that file captures the preview board ID, which differs from the source board used for duplication).

## Still unknown (requires more probing)

- `COLUMN` element type shape
- `IMAGE` element type and upload flow
- `SWATCH` element type
- `ELEMENT_UPDATE` — text content update after creation
- Server replay frame shape (inbound frames on board open — cannot be captured externally)

## Implementation note for ApiCreator

This is **not** a REST API. `ApiCreator` cannot use `MilanoteClient.postJson()` — it must open a Socket.IO v4 WebSocket connection and send `42N["action", {...}]` frames. The existing `MilanoteClient` handles HTTP only; a separate `CollabSocket` class is needed.

Key fields required per create:
- `id` — client-generated element ID
- `location.parentId` — the board receiving the element
- `location.section` — `"CANVAS"` for freeform, `"INBOX"` for list children
- `location.position` — `{x, y, score}` for canvas; `{index, score}` for list
- `meta.creator` / `meta.modifiedBy` — the authenticated userId
- `meta.createdTime` / `meta.modifiedTime` — `Date.now()` ms epoch
- `user._id` / `user.clientId` / `user.clientTick` — from session
- `channels` — `["<boardId>-LIVE"]`
