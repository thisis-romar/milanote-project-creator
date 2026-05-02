/**
 * @file drive-probe-actions.mjs
 * @description Automated Playwright driver for probe sessions — performs Milanote create gestures
 *   by dragging toolbar tools onto the canvas while the background `probe` CLI captures XHR/fetch traffic.
 * @version 1.1.0
 * @created 2026-05-02T00:00:00Z
 * @lastUpdated 2026-05-02T00:00:00Z
 *
 * Usage:
 *   node scripts/drive-probe-actions.mjs
 *
 * Prerequisites:
 *   - Edge must be running with `--remote-debugging-port=9222` (launchEdgeWithCDP handles this)
 *   - User must be logged in to Milanote in their Edge profile
 *   - Run concurrently with: npm run dev -- probe --duration 200 --out .ms-debug/probe-auto.json
 *
 * Architecture note:
 *   Milanote uses a drag-from-toolbar model. Create gestures require a drag from the left-side
 *   Toolbar (class "element-tool-*") to a drop target on the canvas (.canvas-section).
 *   Double-clicking the canvas in a blank area also opens the type picker in some builds.
 */

// Import from compiled dist — run `npm run build` first if these are missing.
import { attachToEdge } from '../dist/cdp/attach.js';
import { getOrOpenMilanotePage } from '../dist/cdp/page.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const MILANOTE_HOME = 'https://app.milanote.com';
const BOARD_LOADED_SELECTOR = [
  '.Board.element-instance',
  '[id^="el-"]',
  '[data-element-id]',
  '[data-node-id]',
  '[class*="elementContainer"]',
  '.canvas-section',
].join(', ');

/** How long to hold a drag before releasing (helps SPA recognize the intent) */
const DRAG_HOLD_MS = 800;
/** Timeout per gesture step (ms) */
const GESTURE_TIMEOUT = 15_000;
/** Timeout for page / board to load */
const NAV_TIMEOUT = 30_000;
/** Pause between gestures (ms) — gives the API call time to fire */
const INTER_GESTURE_PAUSE = 2000;

// ─── Drop targets on the canvas — spaced out so elements don't overlap ────────
// Canvas spans approx x:63–1272, y:44–768.
// We place each drop target in the top portion, spread horizontally.
const DROP_TARGETS = [
  { x: 400, y: 300 }, // Note
  { x: 600, y: 300 }, // Link
  { x: 800, y: 300 }, // Checklist (To-do)
  { x: 1000, y: 300 }, // Board
  { x: 400, y: 500 }, // Column
  { x: 600, y: 500 }, // extra slot
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ts() {
  return new Date().toISOString();
}

function log(msg) {
  console.log(`[${ts()}] ${msg}`);
}

/**
 * Attempt a gesture; on any error log SKIP and return false instead of throwing.
 * @param {string} label
 * @param {() => Promise<unknown>} fn
 * @returns {Promise<{label: string; ok: boolean; error?: string}>}
 */
async function attempt(label, fn) {
  try {
    await fn();
    log(`OK: ${label}`);
    return { label, ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200);
    log(`SKIP: ${label} — ${msg}`);
    return { label, ok: false, error: msg };
  }
}

/**
 * Wait for a selector to appear, return null instead of throwing.
 * @param {import('playwright').Page} page
 * @param {string} selector
 * @param {number} timeout
 */
async function waitForSelectorSafe(page, selector, timeout = 5000) {
  try {
    return await page.waitForSelector(selector, { state: 'visible', timeout });
  } catch {
    return null;
  }
}

/**
 * Drag a toolbar tool by its CSS class suffix (e.g. "element-tool-card") to a
 * canvas drop target coordinate.
 *
 * Playwright's dragAndDrop works well for short drags. For the Milanote toolbar
 * we use mouse.move + mouse.down + move + up with intermediate steps to ensure
 * the SPA's drag listeners register the movement.
 *
 * @param {import('playwright').Page} page
 * @param {string} toolClassSuffix  - e.g. "element-tool-card"
 * @param {{x: number, y: number}} target - canvas drop coordinate
 */
async function dragToolToCanvas(page, toolClassSuffix, target) {
  const toolSelector = `.${toolClassSuffix}.draggable, .ElementTool.${toolClassSuffix}`;
  const tool = await page.waitForSelector(toolSelector, { state: 'visible', timeout: GESTURE_TIMEOUT });
  if (!tool) throw new Error(`Toolbar tool not found: ${toolClassSuffix}`);

  const toolBox = await tool.boundingBox();
  if (!toolBox) throw new Error(`Could not get bounding box for: ${toolClassSuffix}`);

  const sourceX = toolBox.x + toolBox.width / 2;
  const sourceY = toolBox.y + toolBox.height / 2;

  // Ensure page is focused
  await page.bringToFront();

  // Move to tool, press, hold briefly, drag to canvas, release
  await page.mouse.move(sourceX, sourceY, { steps: 5 });
  await page.mouse.down();
  await page.waitForTimeout(300); // let mousedown register

  // Drag in small steps toward target to trigger drag events
  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    const x = sourceX + ((target.x - sourceX) * i) / steps;
    const y = sourceY + ((target.y - sourceY) * i) / steps;
    await page.mouse.move(x, y);
    await page.waitForTimeout(10);
  }

  await page.waitForTimeout(DRAG_HOLD_MS);
  await page.mouse.up();
  await page.waitForTimeout(500);
}

/**
 * Try to dismiss any "Press Enter to confirm" or edit-commit state after a drag,
 * then wait briefly for the API call to fire.
 * @param {import('playwright').Page} page
 */
async function commitAndWait(page) {
  // If a text input is focused after drop, press Escape to commit without entering text
  await page.keyboard.press('Escape');
  await page.waitForTimeout(INTER_GESTURE_PAUSE);
}

/**
 * Get the API root from the page's __clientconf — useful for understanding how requests are routed.
 * @param {import('playwright').Page} page
 */
async function getClientConf(page) {
  return page.evaluate(() => window.__clientconf ?? null);
}

// ─── DOM Snapshot helper ──────────────────────────────────────────────────────

async function takeDomSnapshot(page) {
  const snap = await page.evaluate(() => {
    const tools = [];
    document.querySelectorAll('.Tool.ElementTool').forEach(el => {
      tools.push({ cls: el.className, text: (el.textContent||'').trim() });
    });
    return {
      url: window.location.href,
      title: document.title,
      toolbarTools: tools,
      canvasPresent: !!document.querySelector('.canvas-section'),
      boardPresent: !!document.querySelector('.Board.element-instance'),
    };
  });
  return snap;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('=== drive-probe-actions v1.1 starting ===');

  const browser = await attachToEdge(MILANOTE_HOME);
  log('Attached to Edge via CDP');

  const page = await getOrOpenMilanotePage(browser);
  log(`Got page: ${page.url()}`);

  // Ensure Milanote is loaded
  if (!page.url().includes('app.milanote.com')) {
    log('Navigating to Milanote home...');
    await page.goto(MILANOTE_HOME, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForTimeout(3000);
  }

  // Wait for board canvas to be present
  log('Waiting for canvas...');
  const canvasReady = await waitForSelectorSafe(page, BOARD_LOADED_SELECTOR, NAV_TIMEOUT);
  if (!canvasReady) {
    log('WARN: canvas selector not matched after timeout — attempting anyway');
  }

  // ── DOM snapshot ──────────────────────────────────────────────────────────
  const snap = await takeDomSnapshot(page);
  log(`Board: ${snap.boardPresent}, Canvas: ${snap.canvasPresent}, URL: ${snap.url}`);
  log(`Toolbar tools found: ${snap.toolbarTools.map(t => t.text).join(', ')}`);

  const conf = await getClientConf(page);
  if (conf) {
    log(`API root: "${conf.apiRoot}", appVersion: ${conf.appVersion}`);
    log(`mediaServer: ${conf.mediaServer?.apiUrl}`);
    log(`collab URL: ${conf.collaboration?.url}`);
  }

  // Also log first 3000 chars of raw DOM for selector debugging
  const rawHtml = await page.evaluate(() => document.documentElement.outerHTML);
  console.log('\n=== DOM SNAPSHOT (first 3000 chars) ===');
  console.log(rawHtml.slice(0, 3000));
  console.log('=== END DOM SNAPSHOT ===\n');

  // ── Verify we're on a board we can write to ───────────────────────────────
  const isRootBoard = snap.url.includes('/home') || snap.url.includes(MILANOTE_HOME);
  if (!isRootBoard) {
    log(`WARN: not on home board — URL is ${snap.url}`);
  }

  // ── Gesture sequence ──────────────────────────────────────────────────────
  const results = [];

  // Gesture 1: Create a note card (element-tool-card → canvas)
  results.push(await attempt('drag-note-card', async () => {
    await dragToolToCanvas(page, 'element-tool-card', DROP_TARGETS[0]);
    // After drop, a text area or contenteditable should be focused for the note body
    const noteInput = await waitForSelectorSafe(page,
      '[class*="NoteElement"] [contenteditable], textarea[class*="note"], .note-body', 3000);
    if (noteInput) {
      await noteInput.type('Probe note');
    }
    await commitAndWait(page);
  }));

  // Gesture 2: Create a link card (element-tool-link → canvas)
  results.push(await attempt('drag-link-card', async () => {
    await dragToolToCanvas(page, 'element-tool-link', DROP_TARGETS[1]);
    // After drop, a URL input should appear
    const urlInput = await waitForSelectorSafe(page,
      'input[type="url"], input[placeholder*="url" i], input[placeholder*="link" i], input[placeholder*="http" i], [class*="linkUrl"], [class*="urlInput"]',
      5000);
    if (urlInput) {
      await urlInput.fill('https://example.com');
      await urlInput.press('Enter');
      await page.waitForTimeout(1500); // link preview
    }
    await commitAndWait(page);
  }));

  // Gesture 3: Create a checklist / to-do (element-tool-task-list → canvas)
  results.push(await attempt('drag-checklist', async () => {
    await dragToolToCanvas(page, 'element-tool-task-list', DROP_TARGETS[2]);
    const itemInput = await waitForSelectorSafe(page,
      '[class*="TaskList"] input, [class*="CheckList"] input, [class*="task-list"] [contenteditable], input[placeholder*="item" i], input[placeholder*="task" i]',
      5000);
    if (itemInput) {
      await itemInput.fill('Test item');
      await itemInput.press('Enter');
    }
    await commitAndWait(page);
  }));

  // Gesture 4: Create a nested board (element-tool-board → canvas)
  results.push(await attempt('drag-board-card', async () => {
    await dragToolToCanvas(page, 'element-tool-board', DROP_TARGETS[3]);
    // After drop, inline title edit or dialog
    const titleInput = await waitForSelectorSafe(page,
      '[class*="boardTitle"] input, [class*="BoardTitle"] [contenteditable], input[placeholder*="board" i], input[placeholder*="name" i], input[placeholder*="title" i]',
      5000);
    if (titleInput) {
      await titleInput.fill('Probe Subboard');
      await titleInput.press('Enter');
    }
    await commitAndWait(page);
  }));

  // Gesture 5: Create a column (element-tool-column → canvas)
  results.push(await attempt('drag-column', async () => {
    await dragToolToCanvas(page, 'element-tool-column', DROP_TARGETS[4]);
    const colInput = await waitForSelectorSafe(page,
      '[class*="ColumnTitle"] [contenteditable], [class*="columnTitle"] input, input[placeholder*="column" i], input[placeholder*="section" i]',
      5000);
    if (colInput) {
      await colInput.fill('Test Column');
      await colInput.press('Enter');
    }
    await commitAndWait(page);
  }));

  // ── Observe any new elements on canvas ───────────────────────────────────
  log('Pausing 3s for network to flush...');
  await page.waitForTimeout(3000);

  const newEls = await page.evaluate(() => {
    const els = [];
    document.querySelectorAll('[id^="el-"]').forEach(e => {
      els.push({ id: e.id, cls: (e.className||'').slice(0, 60) });
    });
    return els;
  });
  log(`Canvas elements now: ${newEls.length}`);
  newEls.forEach(e => log(`  ${e.id}: ${e.cls}`));

  // ── Self-cleaning: delete newly created elements ──────────────────────────
  // We'll right-click the canvas area where we dropped elements and delete them.
  // The safest approach is to use Ctrl+Z to undo all gestures.
  results.push(await attempt('undo-all-gestures', async () => {
    const undoCount = results.filter(r => r.ok && r.label !== 'undo-all-gestures').length;
    log(`Undoing ${undoCount} successful gestures via Ctrl+Z...`);
    for (let i = 0; i < undoCount + 2; i++) {
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1000);
  }));

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n=== GESTURE SUMMARY ===');
  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  console.log(`Succeeded (${succeeded.length}/${results.length}):`);
  for (const r of succeeded) console.log(`  + ${r.label}`);
  if (failed.length) {
    console.log(`Failed/Skipped (${failed.length}/${results.length}):`);
    for (const r of failed) console.log(`  - ${r.label}: ${r.error ?? 'unknown'}`);
  }
  console.log('=== END SUMMARY ===\n');

  await page.waitForTimeout(2000);
  await browser.close();
  log('Browser closed. drive-probe-actions complete.');
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
