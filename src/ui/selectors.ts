/**
 * @file selectors.ts
 * @description Milanote DOM selectors — seed set lifted from milanote-extractor; expand via probe sessions
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 *
 * The "boardLoaded" selectors below are the only ones captured anywhere so far.
 * Per-primitive selectors (createBoardButton, addColumnHandle, swatchPicker, etc.)
 * are TODO — discover by inspecting the DOM in a CDP-attached session.
 */

/** Selectors that prove the board canvas has rendered. Lifted from milanote-extractor:181-186. */
export const BOARD_LOADED = [
  '[data-element-id]',
  '[data-node-id]',
  '[class*="elementContainer"]',
  '[class*="boardColumn"]',
  '[class*="NoteElement"]',
  '[class*="LinkElement"]',
] as const;

export const BOARD_LOADED_SELECTOR = BOARD_LOADED.join(', ');

// ── TODO: discover via Phase 2 probe + DevTools inspection ───────────────────

export const TODO = {
  /** Button or drop-target for creating a new top-level board */
  createBoardTrigger: 'TODO',
  /** Input for the new board's title (after createBoardTrigger fires) */
  newBoardTitleInput: 'TODO',
  /** "+" handle for adding a column to the current board */
  addColumnHandle: 'TODO',
  /** Inline column-title input */
  columnTitleInput: 'TODO',
  /** Right-click / "+" menu trigger inside a column */
  cardMenuTrigger: 'TODO',
  /** Menu items by card type (note, link, image, file, swatch, checklist, board) */
  menuItem: {
    note: 'TODO',
    link: 'TODO',
    image: 'TODO',
    file: 'TODO',
    swatch: 'TODO',
    checklist: 'TODO',
    board: 'TODO',
  },
} as const;
