/**
 * @file creator.ts
 * @description ApiCreator — implements Creator via Milanote's HTTP API (endpoints discovered via probe)
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 *
 * Stubbed until Phase 2 probe identifies the real endpoint shapes. Once probe
 * data is in knowledge/milanote/reference/api/, fill in createRootBoard/
 * createColumn/createCard/createSubboard with the discovered shapes and
 * remove the NotImplementedError throws.
 */

import type { Card } from '../template/schema.js';
import type { BoardRef, CardRef, ColumnRef, Creator } from '../creator/types.js';
import { NotImplementedError } from '../creator/types.js';
import type { MilanoteClient } from './client.js';

const PROBE_HINT =
  'Run `npm run dev probe -- --duration 180`, then promote the captured shapes to ' +
  'knowledge/milanote/reference/api/ and src/api/types.ts before plumbing this method.';

export class ApiCreator implements Creator {
  readonly strategy = 'api' as const;

  constructor(private readonly client: MilanoteClient) {
    // client retained for use once endpoints are known
    void this.client;
  }

  async createRootBoard(_title: string, _description?: string): Promise<BoardRef> {
    void _title;
    void _description;
    throw new NotImplementedError('ApiCreator.createRootBoard', PROBE_HINT);
  }

  async createColumn(_parent: BoardRef, _title: string): Promise<ColumnRef> {
    void _parent;
    void _title;
    throw new NotImplementedError('ApiCreator.createColumn', PROBE_HINT);
  }

  async createCard(
    _parent: BoardRef,
    _column: ColumnRef | null,
    _card: Exclude<Card, { type: 'board' }>,
  ): Promise<CardRef> {
    void _parent;
    void _column;
    void _card;
    throw new NotImplementedError(`ApiCreator.createCard(${_card.type})`, PROBE_HINT);
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
    throw new NotImplementedError('ApiCreator.createSubboard', PROBE_HINT);
  }
}
