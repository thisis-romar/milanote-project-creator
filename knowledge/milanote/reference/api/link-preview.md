---
title: Link Preview / Metadata
description: Resolve URL metadata (title, description, image, provider) for a newly-created Link card
version: 1.0.0
created: 2026-05-02T00:00:00Z
last_updated: 2026-05-02T00:00:00Z
---

# Link Preview / Metadata

## Endpoint

`POST https://upload.milanote.com/api/link`

This request is fired automatically by the Milanote SPA immediately after a Link card element
is created (by dropping the "Link" toolbar tool onto the canvas). It fetches URL metadata so
the card can render a rich preview.

## Request

### Headers (observed, sanitised)

```
Content-Type: application/json
Referer: https://app.milanote.com/
```

Auth is provided via cookies on the `upload.milanote.com` domain (not included here).

### Body

```json
{
  "url": "https://example.com",
  "elementId": "<milanote-element-id>",
  "environmentFolder": "p",
  "userId": "<user-id>",
  "locale": "en-au"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `url` | string | The URL the user pasted into the link card |
| `elementId` | string | The Milanote element ID of the newly created Link card (e.g. `1WjfGy1UBJED9j`) |
| `environmentFolder` | string | Always `"p"` in production |
| `userId` | string | The authenticated user's ID |
| `locale` | string | BCP 47 locale tag of the client (e.g. `"en-au"`) |

## Response (200 OK)

```json
{
  "image": {},
  "mediaType": "NO_MEDIA",
  "link": {
    "url": "https://example.com",
    "title": "Example Domain"
  },
  "elementType": "LINK",
  "description": "This domain is for use in documentation examples...",
  "provider": {
    "url": "https://example.com",
    "name": "example",
    "display": "example"
  }
}
```

| Field | Type | Notes |
|-------|------|-------|
| `image` | object | Open-graph / og:image data; empty `{}` if no image found |
| `mediaType` | string | `"NO_MEDIA"`, `"IMAGE"`, `"VIDEO"`, etc. |
| `link.url` | string | Resolved canonical URL |
| `link.title` | string | Page `<title>` / og:title |
| `elementType` | string | Always `"LINK"` for this endpoint |
| `description` | string | og:description or meta description |
| `provider.url` | string | Root URL of the provider |
| `provider.name` | string | Short provider slug (e.g. `"youtube"`) |
| `provider.display` | string | Human-readable provider name |

## Notes

- This is fired by `upload.milanote.com`, **not** `app.milanote.com`. The media server
  handles all asset and URL metadata operations.
- The actual element-create mutation (adding the Link card node to the board) is sent over
  WebSocket to `wss://collab.milanote.com` — not captured by the XHR probe.
- Observed status: `200 OK`
- Observed `Content-Type` response header: `application/json; charset=utf-8`
- The `environmentFolder: "p"` value corresponds to the S3 folder prefix seen in
  `__clientconf.aws.s3Folder` in the page config.

## Discovery method

Captured during automated probe session `2026-05-02-automated-probe` while the Playwright
driver dragged the "Link" toolbar tool (`element-tool-link`) onto the canvas and filled
`https://example.com` into the URL input.
