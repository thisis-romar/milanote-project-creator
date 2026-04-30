/**
 * @file orchestrator.ts
 * @description Walk a parsed template and call the Creator in the right order; API → UI fallback per step
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import chalk from 'chalk';
import type { Card, Column, Template } from '../template/schema.js';
import type { BoardRef, ColumnRef, Creator } from './types.js';
import { NotImplementedError } from './types.js';

export interface OrchestratorOptions {
  /** Primary strategy. Tried first for every operation. */
  primary: Creator;
  /** Optional fallback. Tried if primary throws. */
  fallback?: Creator;
  /** Print progress to stdout */
  verbose?: boolean;
}

export class OrchestratorError extends Error {
  constructor(
    public readonly stage: string,
    public readonly cause: Error,
  ) {
    super(`${stage}: ${cause.message}`);
    this.name = 'OrchestratorError';
  }
}

export async function createFromTemplate(template: Template, opts: OrchestratorOptions): Promise<BoardRef> {
  const log = (depth: number, msg: string): void => {
    if (opts.verbose !== false) {
      console.log('  '.repeat(depth) + chalk.dim('→ ') + msg);
    }
  };

  const tryStep = async <T>(label: string, op: (c: Creator) => Promise<T>): Promise<T> => {
    try {
      return await op(opts.primary);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      if (opts.fallback) {
        console.log(chalk.yellow(`  ${label} via ${opts.primary.strategy} failed (${err.message}); falling back to ${opts.fallback.strategy}`));
        try {
          return await op(opts.fallback);
        } catch (fe) {
          const fallbackErr = fe instanceof Error ? fe : new Error(String(fe));
          throw new OrchestratorError(label, fallbackErr);
        }
      }
      throw new OrchestratorError(label, err);
    }
  };

  // Root board
  log(0, `creating root board: ${chalk.cyan(template.board.title)}`);
  const rootRef = await tryStep('createRootBoard', (c) =>
    c.createRootBoard(template.board.title, template.board.description),
  );

  // Columns + their cards
  if (template.board.columns) {
    for (const col of template.board.columns) {
      await populateColumn(rootRef, col, 1, tryStep, log);
    }
  }

  // Freeform cards
  if (template.board.freeform) {
    for (const card of template.board.freeform) {
      await placeCard(rootRef, null, card, 1, tryStep, log);
    }
  }

  return rootRef;
}

type TryStepFn = <T>(label: string, op: (c: Creator) => Promise<T>) => Promise<T>;
type LogFn = (depth: number, msg: string) => void;

async function populateColumn(
  parent: BoardRef,
  col: Column,
  depth: number,
  tryStep: TryStepFn,
  log: LogFn,
): Promise<void> {
  log(depth, `column: ${chalk.cyan(col.title)}`);
  const colRef = await tryStep(`createColumn(${col.title})`, (c) => c.createColumn(parent, col.title));
  for (const card of col.cards) {
    await placeCard(parent, colRef, card, depth + 1, tryStep, log);
  }
}

async function placeCard(
  parent: BoardRef,
  column: ColumnRef | null,
  card: Card,
  depth: number,
  tryStep: TryStepFn,
  log: LogFn,
): Promise<void> {
  if (card.type === 'board') {
    log(depth, `subboard: ${chalk.cyan(card.title)}`);
    const sub = await tryStep(`createSubboard(${card.title})`, (c) =>
      c.createSubboard(parent, column, card.title, card.description),
    );
    if (card.columns) {
      for (const col of card.columns) await populateColumn(sub, col, depth + 1, tryStep, log);
    }
    if (card.freeform) {
      for (const c of card.freeform) await placeCard(sub, null, c, depth + 1, tryStep, log);
    }
    return;
  }
  log(depth, `card[${card.type}]`);
  await tryStep(`createCard(${card.type})`, (c) => c.createCard(parent, column, card));
}

/**
 * Throws NotImplementedError for every method — useful for the live mode until Phase 2 probe is run.
 * Constructed by stubCreator() with a custom hint.
 */
export function stubCreator(strategy: 'api' | 'ui', hint: string): Creator {
  const fail = (method: string): never => {
    throw new NotImplementedError(method, hint);
  };
  return {
    strategy,
    createRootBoard: () => Promise.reject(new NotImplementedError('createRootBoard', hint)),
    createColumn: () => Promise.reject(new NotImplementedError('createColumn', hint)),
    createCard: () => Promise.reject(new NotImplementedError('createCard', hint)),
    createSubboard: () => Promise.reject(new NotImplementedError('createSubboard', hint)),
    // Mark `fail` referenced so eslint doesn't complain
    [Symbol.for('milanote.stubFail')]: fail,
  } as Creator;
}
