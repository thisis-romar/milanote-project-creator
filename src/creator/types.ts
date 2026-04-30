/**
 * @file types.ts
 * @description Creator interface and ref types — implemented by both API and UI paths
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import type { Card } from '../template/schema.js';

export type Strategy = 'api' | 'ui';

export interface BoardRef {
  readonly id: string;
  readonly url?: string;
}

export interface ColumnRef {
  readonly id: string;
}

export interface CardRef {
  readonly id: string;
  readonly type: Card['type'];
}

export class NotImplementedError extends Error {
  constructor(method: string, hint: string) {
    super(`${method}: not implemented yet. ${hint}`);
    this.name = 'NotImplementedError';
  }
}

/**
 * Creates Milanote primitives. Both ApiCreator and UiCreator implement this.
 * The orchestrator dispatches by walking the template tree.
 */
export interface Creator {
  readonly strategy: Strategy;

  /** Create a top-level board in the user's workspace. */
  createRootBoard(title: string, description?: string): Promise<BoardRef>;

  /** Create a column inside an existing board. */
  createColumn(parent: BoardRef, title: string): Promise<ColumnRef>;

  /**
   * Create a primitive (non-board) card inside a column or freeform area.
   * column=null places the card in the freeform canvas of the parent board.
   */
  createCard(parent: BoardRef, column: ColumnRef | null, card: Exclude<Card, { type: 'board' }>): Promise<CardRef>;

  /** Create a nested board card. Returns the new board's ref so the orchestrator can recurse into it. */
  createSubboard(
    parent: BoardRef,
    column: ColumnRef | null,
    title: string,
    description?: string,
  ): Promise<BoardRef>;
}
