---
title: Freeform vs Columnar Layout
description: When to use Milanote's freeform canvas vs columns to organize cards on a board
version: 1.0.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# Freeform vs Columnar Layout

Milanote's intro video describes the canvas this way:

> Once inside you see a freeform canvas that you can add any type of content to … Now that everything's in one place it's time to get organized. Columns are great for grouping related content … but you can also visually organize things in any way that makes sense to you.

So both are first-class, but the intent differs.

## Use **columns** when

- The content is naturally a list with a heading (Tasks, Inspiration, Color palette)
- The board will be presented or shared and structure helps a viewer scan it
- Card order within the group matters (top-to-bottom reading)
- You want consistent spacing and alignment without managing coordinates

In template JSON:

```json
"board": {
  "columns": [
    { "title": "Brief", "cards": [ ... ] },
    { "title": "Color palette", "cards": [ ... ] }
  ]
}
```

## Use **freeform** when

- Content is spatial — moodboards, sticky-note brainstorms, mind-maps
- Card position carries meaning (clusters, distance, alignment)
- The board is for the author's exploration, not viewer consumption
- You want to mix card sizes and overlap them

In template JSON:

```json
"board": {
  "freeform": [
    { "type": "image", "src": "...", "position": { "x": 100, "y": 200 } },
    { "type": "note",  "text":  "...", "position": { "x": 350, "y": 220 } }
  ]
}
```

## You can mix

A board can have both `columns` and `freeform` simultaneously. The freeform area sits alongside the columns. This is useful for a "scratch space" next to organized columns.

## `position` semantics

The `position?: { x, y }` field is optional. When omitted, Milanote auto-places freeform cards (probable behavior — needs probe to confirm exact rules). When set, the values are likely pixel offsets relative to the board's canvas origin. Coordinate units and origin are TODO; the probe will tell us by capturing the request shape on a card-creation gesture.

Inside a column, `position` is ignored — the column manages vertical order.

## Recommended default

For machine-generated templates (this project's primary use case), prefer **columns** unless spatial layout is explicitly meaningful. Reasons:

1. Columns produce a readable board even before knowing the coordinate system
2. Column order is deterministic, so re-running the same template produces the same result
3. Freeform without thought-out coordinates ends up as a pile

Save freeform for when you have intent (a mood board, a process diagram).
