/**
 * @file validate.test.ts
 * @description Tests for countNodes — recursive template tree stats
 * @version 0.1.0
 * @created 2026-05-04T00:00:00Z
 * @lastUpdated 2026-05-04T00:00:00Z
 */

import { describe, it, expect } from 'vitest';
import { countNodes } from './validate.js';
import { TemplateSchema } from '../template/schema.js';

const parse = (obj: unknown) => TemplateSchema.parse(obj);

describe('countNodes', () => {
  it('counts a minimal board as 1 board, 0 columns, 0 cards', () => {
    const t = parse({ version: 1, board: { title: 'Empty' } });
    expect(countNodes(t)).toMatchObject({ boards: 1, columns: 0, cards: 0, byType: {} });
  });

  it('counts columns', () => {
    const t = parse({ version: 1, board: { title: 'B', columns: [{ title: 'A', cards: [] }, { title: 'B', cards: [] }] } });
    expect(countNodes(t)).toMatchObject({ columns: 2, cards: 0 });
  });

  it('counts cards within a column', () => {
    const t = parse({
      version: 1,
      board: { title: 'B', columns: [{ title: 'C', cards: [{ type: 'note', text: 'x' }, { type: 'swatch', hex: '#FF0000' }] }] },
    });
    const stats = countNodes(t);
    expect(stats.cards).toBe(2);
    expect(stats.byType).toEqual({ note: 1, swatch: 1 });
  });

  it('counts freeform cards', () => {
    const t = parse({ version: 1, board: { title: 'B', freeform: [{ type: 'link', url: 'https://a.com' }] } });
    expect(countNodes(t)).toMatchObject({ cards: 1, byType: { link: 1 } });
  });

  it('counts nested subboards and recurses into them', () => {
    const t = parse({
      version: 1,
      board: {
        title: 'Root',
        freeform: [{
          type: 'board', title: 'Sub',
          columns: [{ title: 'Col', cards: [{ type: 'note', text: 'deep' }] }],
        }],
      },
    });
    const stats = countNodes(t);
    expect(stats.boards).toBe(2);
    expect(stats.columns).toBe(1);
    // countNodes counts the board-type card itself plus its contents
    expect(stats.cards).toBe(2); // 1 board card in freeform + 1 note card inside it
    expect(stats.byType).toMatchObject({ board: 1, note: 1 });
  });

  it('counts all six card types', () => {
    const t = parse({
      version: 1,
      board: {
        title: 'All',
        freeform: [
          { type: 'note', text: 'n' },
          { type: 'link', url: 'https://a.com' },
          { type: 'image', src: 'img.png' },
          { type: 'file', path: '/f.pdf' },
          { type: 'swatch', hex: '#FF0000' },
          { type: 'checklist', items: [{ text: 'x' }] },
        ],
      },
    });
    const stats = countNodes(t);
    expect(stats.cards).toBe(6);
    expect(Object.keys(stats.byType)).toHaveLength(6);
  });
});
