---
title: Template JSON Format Specification
description: Authoritative spec for the milanote-project-creator template format — schema, variable resolution, validation
version: 1.0.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# Template JSON Format Specification

A board template is a single JSON file describing a Milanote board's contents. The canonical Zod definition lives at `src/template/schema.ts`. This doc is the human-readable companion.

## Top-level shape

```json
{
  "$schema": "https://example.com/milanote-template.schema.json",
  "version": 1,
  "variables": { "name": "value" },
  "board": { ... }
}
```

| Field | Required | Notes |
|---|---|---|
| `$schema` | no | URI for editor support; ignored at parse |
| `version` | no | Defaults to `1`. Bump on breaking format changes |
| `variables` | no | Map of `name → string \| { default, description? }` |
| `board` | **yes** | The root board (`title`, `description?`, `columns?`, `freeform?`) |

## Card primitives

Every card has a `type` field. `position?: { x, y }` is optional on every card and only honored when the card is placed via the freeform canvas, not inside a column.

| `type` | Required fields | Optional fields |
|---|---|---|
| `note` | `text` | `position` |
| `link` | `url` | `title`, `description`, `position` |
| `image` | `src` | `caption`, `position` |
| `file` | `path` | `position` |
| `swatch` | `hex` (e.g. `#FF5733`) | `label`, `position` |
| `checklist` | `items: [{ text, done? }, ...]` (≥1) | `title`, `position` |
| `board` | `title` | `description`, `columns`, `freeform`, `position` (recursive, depth ≤ 5) |

## Layout: columns vs freeform

A board can use either, both, or neither:

```json
"board": {
  "title": "Project",
  "columns": [ { "title": "...", "cards": [ ... ] } ],
  "freeform": [ { "type": "...", "position": { "x": 0, "y": 0 } } ]
}
```

See `playbooks/freeform-vs-columnar-layout.md` for guidance.

## Variable substitution

Three forms are supported in any string value (object keys are NOT substituted):

| Form | Source |
|---|---|
| `{{name}}` | Looked up in `variables` block (or CLI `--var name=value` overrides) |
| `{{env.NAME}}` | `process.env.NAME` — throws if unset |
| `{{env.NAME?}}` | `process.env.NAME` — empty string if unset |

Resolution happens **after** JSON parsing: variable values can contain quotes, braces, newlines, etc. without breaking the JSON.

CLI overrides win over template defaults:

```bash
milanote-creator create my-template.json --var brandName=Skylark --var owner=Romar
```

The `variables` block can use either short or full form:

```json
{
  "variables": {
    "brandName": "Voltura",
    "owner": { "default": "Romar", "description": "Project lead" }
  }
}
```

## Validation rules

The parser runs three passes:

1. **Schema validation** (Zod) — strict mode rejects unknown fields. Catches typos (e.g. `swatchColor` instead of `hex`).
2. **Variable resolution** — walks the validated tree, substitutes string values, then re-validates so URL/hex constraints are enforced on the substituted values.
3. **Depth check** — recursive board nesting is capped at 5 levels.

## Examples

See `templates/sneaker-logo-design.json` for an end-to-end example covering every primitive.

## Validating a template

```bash
npm run dev validate templates/your-template.json
npm run dev validate templates/your-template.json --var brandName=X
```

Successful validation prints title, column count, card count, and per-type breakdown. Errors print Zod's structured issue list with field paths.
