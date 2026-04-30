---
title: Nesting Boards
description: How nested boards (subboards) work in Milanote and how the template engine handles recursion
version: 1.0.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# Nesting Boards

From the official intro video:

> The powerful thing about Milanote boards is that you can nest them just like the folders on your computer. Let's create a subboard here to store all the visual references in one place.

So a "subboard" is a board placed as a card on a parent board. It looks like a card, opens like a board on double-click, and contains its own columns + freeform area.

## Template syntax

A board card has the same shape as the root board, minus the wrapper:

```json
{
  "type": "board",
  "title": "Visual References",
  "description": "Subboard for moodboard imagery",
  "columns": [ ... ],
  "freeform": [ ... ]
}
```

It can appear in either a column's `cards` array or the parent's `freeform` array.

## Depth limit

Templates are capped at 5 levels of nesting (`MAX_BOARD_DEPTH` in `src/template/schema.ts`). The parser enforces this with `checkBoardDepth()` after schema validation. The cap exists because:

1. Real Milanote boards rarely nest deeper than 3-4 levels in practice
2. Recursive UI navigation past 5 levels is hard for humans
3. Catches infinite-loop bugs in template authoring

To raise the cap, edit `MAX_BOARD_DEPTH` in `schema.ts` and re-run the depth tests.

## Orchestrator behavior

`src/creator/orchestrator.ts` walks the template depth-first. When it encounters a `board` card, it:

1. Calls `creator.createSubboard(parent, column, title, description)` — returns a new `BoardRef`
2. Recurses into the subboard's `columns` and `freeform` using the new ref as the parent

This means every primitive card creation has a clear parent chain: root → subboard → sub-subboard → ... → card.

## Open questions (probe-needed)

| Question | Why it matters |
|---|---|
| Does Milanote create the subboard with one API call (POST + parent ID), or two calls (POST board + PUT to link)? | Determines `ApiCreator.createSubboard` shape |
| Is the subboard a separate board entity or a "card-of-type-board" that contains a board? | Affects how nested boards appear in board listings |
| Does Milanote enforce its own depth limit? | If yes, our 5-level cap should match theirs |
| What's the UI gesture order: drag board card from sidebar → name → enter? | Determines `UiCreator.createSubboard` Playwright sequence |

Run `npm run dev probe -- --duration 180` and create a 2-level nested board manually during the capture window. The probe will record the full flow.

## Navigation

The intro video notes:

> To get back to the project board just use the navigation in the top left.

This implies a breadcrumb component. We don't need to interact with it for creation — once a subboard is created, our orchestrator already holds the parent ref and continues placing cards. But in UI mode, we may need to navigate INTO the new subboard to add its contents. Probe will reveal whether the URL changes (so we can `page.goto` directly) or whether we need a click sequence.
