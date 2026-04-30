/**
 * @file driver.ts
 * @description UiCreator — Playwright-driven UI fallback for every primitive
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 *
 * Stubbed until DOM selectors are discovered via probe + DevTools inspection.
 * See src/ui/selectors.ts for the TODO selector table.
 */

import type { Page } from 'playwright';
import type { Card } from '../template/schema.js';
import type { BoardRef, CardRef, ColumnRef, Creator } from '../creator/types.js';
import { NotImplementedError } from '../creator/types.js';

const SELECTOR_HINT =
  'DOM selectors are TODO in src/ui/selectors.ts. Open a CDP-attached session, ' +
  'inspect the create-board / add-column / +menu UI in DevTools, fill in the selector table, ' +
  'then plumb each method below.';

export class UiCreator implements Creator {
  readonly strategy = 'ui' as const;

  constructor(private readonly page: Page) {
    void this.page;
  }

  async createRootBoard(_title: string, _description?: string): Promise<BoardRef> {
    void _title;
    void _description;
    throw new NotImplementedError('UiCreator.createRootBoard', SELECTOR_HINT);
  }

  async createColumn(_parent: BoardRef, _title: string): Promise<ColumnRef> {
    void _parent;
    void _title;
    throw new NotImplementedError('UiCreator.createColumn', SELECTOR_HINT);
  }

  async createCard(
    _parent: BoardRef,
    _column: ColumnRef | null,
    card: Exclude<Card, { type: 'board' }>,
  ): Promise<CardRef> {
    void _parent;
    void _column;
    throw new NotImplementedError(`UiCreator.createCard(${card.type})`, SELECTOR_HINT);
  }

  async createSubboard(
    _parent: BoardRef,
    _column: ColumnRef | null,
    _title: string,
    _description?: string,
  ): Promise<BoardRef> {
    void _parent;
    void _column;
    void _title;
    void _description;
    throw new NotImplementedError('UiCreator.createSubboard', SELECTOR_HINT);
  }
}
