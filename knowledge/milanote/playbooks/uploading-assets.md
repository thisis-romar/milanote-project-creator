---
title: Uploading Assets
description: Strategy for image and file card uploads — API multipart vs UI drag-drop
version: 1.0.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# Uploading Assets

Image and file cards reference asset content (`src` for image, `path` for file). The asset must exist in Milanote's storage before the card can reference it. This playbook covers both upload paths.

## Source classification

`src/template/assets.ts` exposes `classifySource(src)` returning `'url'` or `'local'`:

```ts
classifySource('https://example.com/photo.jpg'); // 'url'
classifySource('./assets/logo.png');             // 'local'
```

URLs may not need uploading — Milanote may fetch them server-side or proxy them. Probe will confirm. Local paths always require upload.

`assertLocalExists(src)` throws if a local path doesn't exist on disk. Call this early so the template fails fast rather than mid-orchestration.

## API path (preferred, post-probe)

Expected flow (TODO confirm via probe):

1. **Sign URL or get upload target** — `POST /api/upload/sign` (or similar) returning a signed URL or upload ticket
2. **Upload bytes** — `PUT` or multipart `POST` to the signed URL
3. **Create the card** — `POST /api/elements` (or similar) with `{ type: 'image', assetId: <returned id> }`

This is two-or-three round-trips per asset. Run them serially per asset; let the rate limiter handle pacing.

Alternative pattern Milanote may use: a single multipart `POST` that combines upload + element creation. The probe will tell us.

## UI fallback

When the API path fails or is undiscovered, `UiCreator.createCard` for image/file types should:

1. Trigger the parent column or canvas's "+ menu" (or right-click)
2. Click "Image" / "File"
3. Use Playwright's `page.setInputFiles(...)` on the file picker — this works for inputs hidden inside a drop zone too
4. Wait for the upload to complete (progress indicator gone, element rendered)
5. If image with caption: locate the caption input and type the caption

Selectors are TODO in `src/ui/selectors.ts`.

## URL-source images

For `image` cards with a URL `src`, the simpler path may be:

1. Open the column's "+ menu"
2. Click "Image"
3. Switch to the "From URL" tab (if Milanote has one) or paste the URL into a recognized field
4. Confirm

Milanote's intro video mentions:

> There's a built-in image library with millions of beautiful photos which is perfect for finding inspiration.

This is a separate feature — out of v0 scope. Don't confuse it with URL-source image cards.

## Checklist

Before plumbing the asset uploader:

- [ ] Probe captured the upload-sign request shape
- [ ] Probe captured the upload PUT/multipart shape
- [ ] Probe captured the element-create request that references the uploaded asset
- [ ] `src/api/types.ts` has Zod schemas for all three response shapes
- [ ] `src/template/assets.ts` exports a real `AssetUploader` implementation
- [ ] Image with caption confirmed (caption may be a separate update call)
- [ ] File path with arbitrary extension tested (binary types, large files)

## Constraints

- Never log binary asset content
- Never commit `.ms-debug/` probe artifacts — they may contain image bytes
- Local paths are resolved relative to the **template file's** directory, not the project cwd (TBD — implement when assets are wired up; document in `format-spec.md`)
