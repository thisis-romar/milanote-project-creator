/**
 * @file selectors.ts
 * @description Milanote DOM selectors — seed set lifted from milanote-extractor; expanded via probe sessions
 * @version 0.2.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-05-03T00:00:00Z
 *
 * Confidence levels used in comments:
 *   CONFIRMED  — selector observed working in drive-probe-actions.mjs probe session or CDP probe
 *   SCREENSHOT — selector inferred from DOM screenshots captured during probe
 *   INFERRED   — derived from Milanote's naming convention / class patterns seen in probe
 *   PLACEHOLDER — best-guess from toolbar labels / aria conventions; needs live DOM inspection
 *
 * Primary evidence sources:
 *   - scripts/drive-probe-actions.mjs — drag-from-toolbar gestures all succeeded using these classes (2026-05-02)
 *   - knowledge/audit/2026-05-02-automated-probe.md — probe session report
 *   - CDP Runtime.evaluate probe on live home workspace (2026-05-03):
 *       confirmed: .canvas-section, .board-content, .element-tool-{card,link,task-list,board,column}
 *       confirmed: .MoreTool (class: "ToolbarPopupTool MoreTool"), input.FileInput[type=file] (image/*)
 *       confirmed title div: div.ElementSimpleContentEditable.multiline.editable-title (board title in DOM)
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

// ── Discovered via Phase 2 probe + DOM inspection ────────────────────────────
//
// Milanote uses a drag-from-toolbar creation model. The left sidebar toolbar
// contains draggable elements with class `.ElementTool.element-tool-<type>`.
// Dragging any tool item onto the `.canvas-section` creates that element type.
// This was CONFIRMED in the 2026-05-02 probe session (all 5 gestures succeeded).
//
// The "card menu" concept in Milanote is the toolbar itself — there is no
// per-column "+" context menu for most primitives. The toolbar tools ARE the menu.
// A secondary route: right-click on the canvas to get a context menu (unprobed).

export const TOOLBAR = {
  /**
   * Draggable toolbar tool for creating a note card.
   * CONFIRMED — probe session 2026-05-02 (element-tool-card drag succeeded).
   * Matches `.ElementTool.element-tool-card.draggable` in live DOM.
   */
  note: '.element-tool-card',

  /**
   * Draggable toolbar tool for creating a link card.
   * CONFIRMED — probe session 2026-05-02 (element-tool-link drag succeeded).
   */
  link: '.element-tool-link',

  /**
   * Draggable toolbar tool for creating a checklist / to-do card.
   * CONFIRMED — probe session 2026-05-02 (element-tool-task-list drag succeeded).
   * Note: Milanote labels this "To-do" in the UI; internal class uses "task-list".
   */
  checklist: '.element-tool-task-list',

  /**
   * Draggable toolbar tool for creating a board (nested or top-level).
   * CONFIRMED — probe session 2026-05-02 (element-tool-board drag succeeded).
   */
  board: '.element-tool-board',

  /**
   * Draggable toolbar tool for creating a column.
   * CONFIRMED — probe session 2026-05-02 (element-tool-column drag succeeded).
   */
  column: '.element-tool-column',

  /**
   * "Add image" toolbar button — opens a file picker or stock-image library.
   * SCREENSHOT — visible in board-inspect.png as a button labelled "Add image".
   * Class pattern follows the same ElementTool convention; "image" suffix inferred.
   * INFERRED (confirm via DevTools inspection).
   */
  image: '.element-tool-image',

  /**
   * "Upload" toolbar button — opens a file-picker for arbitrary file upload.
   * SCREENSHOT — visible in board-inspect.png labelled "Upload".
   * INFERRED class suffix; may be "element-tool-upload" or "element-tool-file".
   */
  file: '.element-tool-upload',

  /**
   * "..." (More) overflow button that reveals additional tools including swatch/color.
   * CONFIRMED 2026-05-03 — CDP probe confirmed class "ToolbarPopupTool MoreTool".
   * Click to expand, then pick swatch or image from the popup.
   */
  moreTrigger: '.MoreTool',
} as const;

export const CANVAS = {
  /** The main drop-target for drag-from-toolbar gestures. CONFIRMED in probe (2026-05-02). */
  section: '.canvas-section',
  /** Outer board-content wrapper. CONFIRMED 2026-05-03 via CDP probe on home workspace. */
  boardContent: '.board-content',
} as const;

export const UPLOADS = {
  /**
   * Hidden file input present on all board pages. Accepts image/* files.
   * CONFIRMED 2026-05-03 — CDP probe found input.FileInput[type="file"][accept="image/*"].
   * Use page.setInputFiles(UPLOADS.fileInput, path) after triggering the image tool.
   */
  fileInput: 'input.FileInput',
} as const;

export const CREATE_FLOW = {
  /**
   * The trigger for creating a new top-level board.
   * On the Milanote Home board, drag the Board toolbar tool (.element-tool-board)
   * onto the canvas. This is the same gesture used for nested boards.
   * CONFIRMED — probe session 2026-05-02.
   * For a programmatic "New board" via right-click menu, the selector below is
   * a PLACEHOLDER targeting a context-menu item labelled "Board".
   */
  createBoardTrigger: '.element-tool-board',

  /**
   * Input that appears after dropping a board tile — for setting the board title.
   * CONFIRMED 2026-05-03: board title renders as a contenteditable div with classes
   * "ElementSimpleContentEditable multiline editable-title" (seen on live board via CDP).
   * This selector matches the editable div; `tryFill` handles the contenteditable path.
   * Fallback candidates left in place in case the post-drop input has a different class.
   */
  newBoardTitleInput: [
    '.ElementSimpleContentEditable.editable-title[contenteditable]',
    '[class*="BoardTitle"] [contenteditable]',
    '[class*="boardTitle"] input',
    'input[placeholder*="board" i]',
    'input[placeholder*="name" i]',
    'input[placeholder*="title" i]',
  ].join(', '),

  /**
   * Handle to add a column to the current board.
   * Milanote uses drag-from-toolbar for columns — drag .element-tool-column onto canvas.
   * CONFIRMED in probe. There is no separate "+" button per-board; the toolbar IS the trigger.
   * This alias points to the toolbar column tool for driver code clarity.
   */
  addColumnHandle: '.element-tool-column',

  /**
   * Inline column-title input shown after a column is dropped.
   * INFERRED: same ElementSimpleContentEditable pattern as board titles, targeted to
   * the column context. The `.editable-title` class was confirmed on a board title div;
   * column titles likely use the same or a sibling class.
   * PLACEHOLDER for the exact selector post-drop — confirm via DevTools after column-drop.
   */
  columnTitleInput: [
    '.ElementSimpleContentEditable.editable-title[contenteditable]',
    '[class*="ColumnTitle"] [contenteditable]',
    '[class*="columnTitle"] input',
    'input[placeholder*="column" i]',
    'input[placeholder*="section" i]',
  ].join(', '),

  /**
   * Card menu trigger inside a column.
   * In Milanote there is no dedicated per-column "+" button for cards in a column;
   * the canonical flow is to drag a toolbar tool directly into the column area.
   * A secondary flow uses double-click on an empty canvas area to pop a type-picker
   * (described in tutorial transcripts as "double click anywhere to start making notes").
   * Right-click on the canvas surfaces a context menu (unprobed; selector below is PLACEHOLDER).
   * The driver should prefer drag-from-toolbar (TOOLBAR selectors above) over this trigger.
   */
  cardMenuTrigger: [
    // Right-click context-menu "+" button inside a column (PLACEHOLDER):
    '[class*="boardColumn"] [class*="addCard"], [class*="ColumnAddButton"]',
    // Double-click on canvas opens a type-picker in some builds (PLACEHOLDER):
    '.canvas-section',
  ].join(', '),

  /**
   * Menu items by card type — selectors for items in the right-click context menu
   * or the double-click type-picker popup.
   * The toolbar drag-from-toolbar approach is preferred (see TOOLBAR.*), but if a
   * popup menu is used these selectors target the individual menu items.
   *
   * NOTE: The context menu / type-picker was NOT probed in the 2026-05-02 session.
   * All selectors below are PLACEHOLDER — inferred from Milanote class naming conventions
   * and aria-label patterns. Confirm via DevTools inspection of a right-click menu.
   */
  menuItem: {
    /** PLACEHOLDER — right-click context menu "Note" item */
    note: '[class*="ContextMenu"] [class*="note" i], [data-action="add-note"], button[aria-label*="Note"]',
    /** PLACEHOLDER — right-click context menu "Link" item */
    link: '[class*="ContextMenu"] [class*="link" i], [data-action="add-link"], button[aria-label*="Link"]',
    /** PLACEHOLDER — right-click context menu "Image" item */
    image: '[class*="ContextMenu"] [class*="image" i], [data-action="add-image"], button[aria-label*="Image"]',
    /** PLACEHOLDER — right-click context menu "File" or "Upload" item */
    file: '[class*="ContextMenu"] [class*="file" i], [data-action="add-file"], button[aria-label*="File"]',
    /**
     * Swatch creation: paste a hex value into a note to auto-convert it to a swatch
     * (described in "Essential tips" transcript). No dedicated menu item confirmed.
     * PLACEHOLDER for a context-menu swatch entry.
     */
    swatch: '[class*="ContextMenu"] [class*="color" i], [class*="ContextMenu"] [class*="swatch" i], button[aria-label*="Color"]',
    /** PLACEHOLDER — right-click context menu "Checklist" or "To-do" item */
    checklist: '[class*="ContextMenu"] [class*="task" i], [class*="ContextMenu"] [class*="checklist" i], button[aria-label*="To-do"]',
    /** PLACEHOLDER — right-click context menu "Board" item */
    board: '[class*="ContextMenu"] [class*="board" i], [data-action="add-board"], button[aria-label*="Board"]',
  },
} as const;

// ── Legacy alias — kept so any existing caller of the old TODO export still compiles ──
/** @deprecated Use TOOLBAR, CANVAS, or CREATE_FLOW instead. */
export const TODO = CREATE_FLOW;
