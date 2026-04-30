---
title: Milanote Element Types — Index
description: Per-primitive reference index. Each entry documents what the element is, its template schema, and known UI/API gaps.
version: 1.0.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# Milanote Element Types — Index

The seven supported card primitives plus the board container. Each row links to a deeper per-element reference doc (TODO post-probe) and to the relevant playbook.

| Element | Schema | Source of truth | API shape | UI gesture | Playbook |
|---|---|---|---|---|---|
| `note` | `{ text }` | intro video | TODO probe | TODO probe | playbooks/creating-a-note.md (TODO) |
| `link` | `{ url, title?, description? }` | baseline primitive | TODO probe | TODO probe | playbooks/creating-a-link.md (TODO) |
| `image` | `{ src, caption? }` | intro video | TODO probe (likely multipart upload + element-create) | drag/drop | playbooks/creating-an-image-with-caption.md (TODO) |
| `file` | `{ path }` | baseline | TODO probe | TODO probe | playbooks/uploading-assets.md |
| `swatch` | `{ hex, label? }` | intro video | TODO probe | TODO probe | playbooks/creating-a-swatch.md (TODO) |
| `checklist` | `{ items: [{text, done?}], title? }` | intro video | TODO probe | TODO probe | playbooks/creating-a-checklist.md (TODO) |
| `board` (nested) | `{ title, description?, columns?, freeform? }` | intro video | TODO probe (likely create + parent-link) | drag from sidebar | playbooks/nesting-boards.md |

## Source of truth

Primary reference: [knowledge/milanote/reference/concepts/intro-video-2026-04-29.md](../concepts/intro-video-2026-04-29.md) — the official Milanote intro video transcript names every element shown above and describes the basic creation gesture for each.

Secondary reference: [knowledge/milanote/reference/videos/INDEX.md](../videos/INDEX.md) — additional tutorial videos (Sharing & collaboration, Web Clipper).

## Filling in the TODOs

After running a probe session (`npm run dev probe`), promote findings as follows:

1. Per-element doc → `reference/elements/<type>.md` with the captured request shape, response shape, observed status codes
2. Update this INDEX with concrete API/UI columns
3. Update the playbook with the exact create flow
4. Update `src/api/types.ts` with Zod schemas for the API responses
5. Implement the corresponding method in `src/api/creator.ts` and/or `src/ui/driver.ts`
6. Rebuild the graph: `/graphify knowledge/milanote knowledge/audit`
