---
title: Milanote Web Clipper REST API (Extension v2.3.7)
description: REST endpoints discovered via static analysis of background.bundle.js — POST /api/elements is the canonical create path
version: 1.0.0
created: 2026-05-02T16:25:20Z
last_updated: 2026-05-02T16:25:20Z
---

<!-- source: static analysis of C:\Users\romar\AppData\Local\Microsoft\Edge\User Data\Default\Extensions\pahhnjjlcoacakpcoabamdhbhnjjlpfg\2.3.7_0\background.bundle.js -->

# Milanote Web Clipper REST API

## Key finding for ApiCreator

**`POST /api/elements` is the production-stable REST endpoint for element creation.**
The entire Web Clipper extension relies on it. This replaces the Socket.IO (CollabSocket)
approach — standard HTTP is simpler, more reliable, and already supported by `MilanoteClient`.

---

## Base URLs

| Purpose | URL |
|---------|-----|
| API | `https://app.milanote.com` |
| Media / extract | `https://upload.milanote.com` |
| OAuth | `https://app.milanote.com` |
| Extension client ID | `XxW665MHua08q48` |

---

## Authentication

The extension uses **OAuth2 implicit grant** via `chrome.identity`:
```
GET https://app.milanote.com/oauth/authorize
    ?response_type=token
    &client_id=XxW665MHua08q48
    &redirect_uri=<chrome-extension-redirect>
```

Bearer token stored in `chrome.storage.local` as `access_token`.
Every request carries: `Authorization: Bearer <token>`.

> **Note for ApiCreator:** The web app (and our CDP session) uses cookies, not Bearer tokens.
> Milanote likely accepts both. Try cookie auth first (`MilanoteClient` already handles this).
> If `POST /api/elements` returns 401 with cookies, exchange cookies for a Bearer token via
> `GET /api/users/me/app-init/browser-extension` and use `Authorization: Bearer <token>`.

---

## Permissions token

A secondary token is required on write requests:

```
GET /api/permissions/token?ids=<boardId1>,<boardId2>,...
```

Response: `{ token: "<permissions_token>" }`

This token is included as:
- `?tokens=<token>` on GET requests
- `{ "tokens": "<token>" }` in the POST body

---

## Discovered endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/elements` | POST | **Create elements (canonical write path)** |
| `GET /api/elements?ids=...&loadAncestors=false` | GET | Fetch boards/elements by ID |
| `GET /api/users/me/app-init/browser-extension` | GET | Bootstrap: user info + permissionIds + board list |
| `GET /api/permissions/token?ids=...` | GET | Get permissions token for writes |
| `GET https://upload.milanote.com/api/link/extract?url=...` | GET | Link metadata preview |
| `GET /oauth/authorize` | GET | OAuth login |
| `GET /oauth/logout` | GET | Logout |

---

## POST /api/elements — Create elements

### Request

```
POST https://app.milanote.com/api/elements
Content-Type: application/json
Authorization: Bearer <token>   (or Cookie: ... for web-app sessions)
```

```json
{
  "elements": [
    { ...element1 },
    { ...element2 }
  ],
  "tokens": "<permissions_token>"
}
```

Bulk create — send multiple elements in one request (entire template in a single POST).

### Element shapes

**LINK card:**
```json
{
  "elementType": "LINK",
  "clientId": "<client-generated-uuid>",
  "parentId": "<board-id>",
  "url": "https://example.com"
}
```

**IMAGE (data URI):**
```json
{
  "elementType": "IMAGE",
  "clientId": "<client-generated-uuid>",
  "parentId": "<board-id>",
  "image": "data:image/png;base64,...",
  "caption": "Optional caption"
}
```

**CARD (text/note) — uses Tiptap document JSON:**
```json
{
  "elementType": "CARD",
  "clientId": "<client-generated-uuid>",
  "parentId": "<board-id>",
  "text": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Note content here" }]
      }
    ]
  }
}
```

> `text` is **Tiptap document JSON**, not a plain string.

**BOARD (nested board):**
```json
{
  "elementType": "BOARD",
  "clientId": "<client-generated-uuid>",
  "parentId": "<parent-board-id>"
}
```

### ELEMENT_TYPES enum
`LINK`, `CARD`, `IMAGE`, `BOARD`, `COLUMN`, `LINE`

---

## Implementation plan for ApiCreator

Replace the Socket.IO `CollabSocket` approach with:

```ts
// 1. Get permissions token for the target board
const { token } = await client.getJson<{ token: string }>(
  `/api/permissions/token?ids=${boardId}`
);

// 2. Bulk-create elements
await client.postJson('/api/elements', {
  elements: [
    { elementType: 'CARD', clientId: generateId(), parentId: boardId, text: tiptapDoc(text) },
    { elementType: 'LINK', clientId: generateId(), parentId: boardId, url },
  ],
  tokens: token,
});
```

`clientId` is a client-generated UUID (or Milanote-format alphanumeric ID).
`MilanoteClient.postJson()` handles cookies + rate limiting — no new dependencies needed.

---

## What is still unknown

- COLUMN element create shape
- BOARD title field (may be a separate ELEMENT_UPDATE after creation)
- SWATCH / TASK_LIST / TASK via REST (may differ from Socket.IO shapes)
- Whether cookie auth works for `POST /api/elements` (likely yes — try first)
- Server response shape (element ID confirmation)
