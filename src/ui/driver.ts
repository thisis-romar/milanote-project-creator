/**
 * @file driver.ts
 * @description UiCreator — Playwright-driven UI fallback using drag-from-toolbar gestures
 * @version 0.2.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-05-02T20:30:00Z
 *
 * Primary creation mechanism: drag from the left toolbar onto .canvas-section.
 * Confirmed working in the 2026-05-02 probe session for: note, link, checklist,
 * board, column. See src/ui/selectors.ts for confidence levels on each selector.
 *
 * Title/content input selectors are still PLACEHOLDER — elements are created but
 * may be left with default empty titles until those selectors are confirmed via
 * DevTools inspection. The ApiCreator (Socket.IO) is preferred; this is fallback only.
 */

import type { Page } from 'playwright';
import type { Card } from '../template/schema.js';
import type { BoardRef, CardRef, ColumnRef, Creator } from '../creator/types.js';
import { NotImplementedError } from '../creator/types.js';
import { TOOLBAR, CANVAS, CREATE_FLOW, UPLOADS } from './selectors.js';

export class UiCreator implements Creator {
  readonly strategy = 'ui' as const;

  constructor(private readonly page: Page) {}

  // ── Internal helpers ───────────────────────────────���──────────────────────

  /** Drag a toolbar tool to the canvas. CONFIRMED gesture. */
  private async dragTool(toolSelector: string): Promise<void> {
    await this.page.waitForSelector(toolSelector, { timeout: 5_000 });
    await this.page.waitForSelector(CANVAS.section, { timeout: 5_000 });
    await this.page.dragAndDrop(toolSelector, CANVAS.section);
    // Give Milanote time to render the new element and open any title input
    await this.page.waitForTimeout(400);
  }

  /**
   * Attempt to fill a PLACEHOLDER title/content input.
   * Returns true if the input was found and filled, false if it wasn't visible.
   * Never throws — missing inputs degrade gracefully (element created untitled).
   */
  private async tryFill(selector: string, text: string): Promise<boolean> {
    try {
      const el = await this.page.waitForSelector(selector, { timeout: 1_500 });
      const tag = await el.evaluate((n) => n.tagName.toLowerCase());
      if (tag === 'input' || tag === 'textarea') {
        await el.fill(text);
      } else {
        // contenteditable div
        await el.click();
        await this.page.keyboard.type(text);
      }
      await this.page.keyboard.press('Escape');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read the data-element-id of the most recently added element on the canvas.
   * Falls back to a synthetic ID if no element is found (prevents null crashes).
   */
  private async lastElementId(): Promise<string> {
    const id = await this.page.evaluate(() => {
      const els = document.querySelectorAll('[data-element-id]');
      return els[els.length - 1]?.getAttribute('data-element-id') ?? null;
    });
    return id ?? `ui-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // ── Creator interface ────────────────────────────���────────────────────────

  async createRootBoard(title: string, _description?: string): Promise<BoardRef> {
    await this.dragTool(TOOLBAR.board);
    const filled = await this.tryFill(CREATE_FLOW.newBoardTitleInput, title);
    if (!filled) {
      console.warn(`UiCreator.createRootBoard: title input not found — board may be untitled (selector: ${CREATE_FLOW.newBoardTitleInput})`);
    }
    const id = await this.lastElementId();
    return { id, url: `https://app.milanote.com/${id}/` };
  }

  async createColumn(_parent: BoardRef, title: string): Promise<ColumnRef> {
    await this.dragTool(TOOLBAR.column);
    const filled = await this.tryFill(CREATE_FLOW.columnTitleInput, title);
    if (!filled) {
      console.warn(`UiCreator.createColumn: title input not found — column may be untitled`);
    }
    const id = await this.lastElementId();
    return { id };
  }

  async createCard(
    _parent: BoardRef,
    _column: ColumnRef | null,
    card: Exclude<Card, { type: 'board' }>,
  ): Promise<CardRef> {
    switch (card.type) {
      case 'note':
        await this.dragTool(TOOLBAR.note);
        await this.tryFill('[contenteditable]', card.text);
        break;

      case 'link':
        await this.dragTool(TOOLBAR.link);
        // Link URL/title entry varies by Milanote version; best-effort fill
        await this.tryFill('input[placeholder*="url" i], input[placeholder*="link" i], input[type="url"]', card.url);
        if (card.title) await this.tryFill('input[placeholder*="title" i], input[placeholder*="name" i]', card.title);
        break;

      case 'checklist':
        await this.dragTool(TOOLBAR.checklist);
        if (card.title) await this.tryFill('input[placeholder*="title" i], [class*="TaskListTitle"]', card.title);
        break;

      case 'image':
        // Local file path: inject via the hidden FileInput (confirmed present, accepts image/*).
        // URL-based images: the ApiCreator handles those via Socket.IO; warn and skip here.
        if (card.src && !card.src.startsWith('http')) {
          await this.page.setInputFiles(UPLOADS.fileInput, card.src);
          await this.page.waitForTimeout(1_500); // wait for upload + element creation
        } else {
          console.warn('UiCreator.createCard(image): URL-based src not supported in UI fallback; use ApiCreator');
        }
        break;

      case 'swatch':
        // Swatch tool is behind .MoreTool overflow.
        // CONFIRMED 2026-05-04: class ".element-tool-color-swatch" (label "Color").
        // Clicking MoreTool first expands it so the swatch tool becomes draggable.
        await this.page.click(TOOLBAR.moreTrigger).catch(() => {});
        await this.page.waitForTimeout(300);
        await this.dragTool(TOOLBAR.swatch);
        // Color input: after dropping, a hex input or color picker may appear.
        // The ApiCreator is preferred for swatches (sets color directly). If the
        // UI flow requires more interaction here, extend this case.
        break;

      case 'file':
        throw new NotImplementedError(
          'UiCreator.createCard(file)',
          'File upload requires a signed S3 URL flow — not implemented in either creator.',
        );

      default: {
        const exhaustive: never = card;
        throw new Error(`Unknown card type: ${(exhaustive as Card).type}`);
      }
    }

    const id = await this.lastElementId();
    return { id, type: card.type };
  }

  async createSubboard(
    _parent: BoardRef,
    _column: ColumnRef | null,
    title: string,
    _description?: string,
  ): Promise<BoardRef> {
    await this.dragTool(TOOLBAR.board);
    const filled = await this.tryFill(CREATE_FLOW.newBoardTitleInput, title);
    if (!filled) {
      console.warn(`UiCreator.createSubboard: title input not found — subboard may be untitled`);
    }
    const id = await this.lastElementId();
    return { id, url: `https://app.milanote.com/${id}/` };
  }
}
