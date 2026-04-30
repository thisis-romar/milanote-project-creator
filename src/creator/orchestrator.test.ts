/**
 * @file orchestrator.test.ts
 * @description Vitest tests for the plan builder, orchestrator, and stub creator
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import { describe, it, expect, vi } from 'vitest';
import { TemplateSchema } from '../template/schema.js';
import { buildPlan, summarize } from './plan.js';
import { createFromTemplate, stubCreator, OrchestratorError } from './orchestrator.js';
import { NotImplementedError } from './types.js';
import { substitute, VariableResolutionError } from '../template/variables.js';
import type { BoardRef, ColumnRef, CardRef, Creator } from './types.js';
import type { Card } from '../template/schema.js';

// ── buildPlan ────────────────────────────────────────────────────────────────

describe('buildPlan', () => {
  it('returns a root board step at depth 0', () => {
    const t = TemplateSchema.parse({ version: 1, board: { title: 'Root' } });
    const steps = buildPlan(t);
    expect(steps[0]).toMatchObject({ kind: 'board', title: 'Root', depth: 0 });
  });

  it('produces column at depth 1, card at depth 2', () => {
    const t = TemplateSchema.parse({
      version: 1,
      board: { title: 'B', columns: [{ title: 'Col', cards: [{ type: 'note', text: 'hi' }] }] },
    });
    const steps = buildPlan(t);
    expect(steps.find((s) => s.kind === 'column')?.depth).toBe(1);
    expect(steps.find((s) => s.kind === 'card')?.depth).toBe(2);
  });

  it('labels freeform items correctly', () => {
    const t = TemplateSchema.parse({
      version: 1,
      board: { title: 'B', freeform: [{ type: 'swatch', hex: '#FF0000', label: 'Red' }] },
    });
    const steps = buildPlan(t);
    expect(steps.find((s) => s.kind === 'freeform')).toBeTruthy();
    expect(steps.find((s) => s.cardType === 'swatch')?.title).toBe('#FF0000 Red');
  });

  it('recurses into nested boards', () => {
    const t = TemplateSchema.parse({
      version: 1,
      board: {
        title: 'Root',
        freeform: [{ type: 'board', title: 'Sub', freeform: [{ type: 'note', text: 'deep' }] }],
      },
    });
    const steps = buildPlan(t);
    const subboard = steps.find((s) => s.kind === 'subboard');
    expect(subboard).toBeTruthy();
    expect(subboard?.depth).toBe(2); // freeform is depth 1, subboard inside is depth 2
    const deepCard = steps.find((s) => s.cardType === 'note');
    expect(deepCard?.depth).toBeGreaterThan(subboard!.depth);
  });

  it('covers all card types in the sneaker template', () => {
    const t = TemplateSchema.parse({
      version: 1,
      board: {
        title: 'All',
        columns: [
          {
            title: 'Mix',
            cards: [
              { type: 'note', text: 'n' },
              { type: 'link', url: 'https://a.com' },
              { type: 'image', src: 'img.png' },
              { type: 'file', path: '/f.pdf' },
              { type: 'swatch', hex: '#FF0000' },
              { type: 'checklist', items: [{ text: 'x' }] },
            ],
          },
        ],
      },
    });
    const types = buildPlan(t)
      .filter((s) => s.kind === 'card')
      .map((s) => s.cardType);
    expect(types).toContain('note');
    expect(types).toContain('link');
    expect(types).toContain('image');
    expect(types).toContain('file');
    expect(types).toContain('swatch');
    expect(types).toContain('checklist');
  });
});

describe('summarize', () => {
  it('counts boards, columns, and cards', () => {
    const t = TemplateSchema.parse({
      version: 1,
      board: {
        title: 'B',
        columns: [{ title: 'C', cards: [{ type: 'note', text: 'x' }, { type: 'swatch', hex: '#FFFFFF' }] }],
      },
    });
    const s = summarize(buildPlan(t));
    expect(s).toContain('note=1');
    expect(s).toContain('swatch=1');
    expect(s).toContain('column=1');
  });
});

// ── stubCreator ──────────────────────────────────────────────────────────────

describe('stubCreator', () => {
  it('throws NotImplementedError with the given strategy', async () => {
    const c = stubCreator('api', 'run the probe');
    await expect(c.createRootBoard('T')).rejects.toThrow(NotImplementedError);
    await expect(c.createColumn({ id: '1' }, 'Col')).rejects.toThrow(NotImplementedError);
  });

  it('reports the correct strategy', () => {
    expect(stubCreator('api', '').strategy).toBe('api');
    expect(stubCreator('ui', '').strategy).toBe('ui');
  });
});

// ── createFromTemplate ───────────────────────────────────────────────────────

function mockCreator(overrides: Partial<Creator> = {}): Creator {
  let boardSeq = 0;
  let colSeq = 0;
  let cardSeq = 0;
  return {
    strategy: 'api',
    createRootBoard: vi.fn(async (_title: string): Promise<BoardRef> => ({ id: `board-${++boardSeq}` })),
    createColumn: vi.fn(async (_parent: BoardRef, _title: string): Promise<ColumnRef> => ({ id: `col-${++colSeq}` })),
    createCard: vi.fn(async (_parent: BoardRef, _col: ColumnRef | null, _card: Exclude<Card, { type: 'board' }>): Promise<CardRef> => ({ id: `card-${++cardSeq}`, type: _card.type })),
    createSubboard: vi.fn(async (_parent: BoardRef, _col: ColumnRef | null, _title: string): Promise<BoardRef> => ({ id: `sub-${++boardSeq}`, url: `https://app.milanote.com/sub-${boardSeq}` })),
    ...overrides,
  };
}

describe('createFromTemplate', () => {
  it('calls createRootBoard once with the board title', async () => {
    const creator = mockCreator();
    const t = TemplateSchema.parse({ version: 1, board: { title: 'My Board' } });
    await createFromTemplate(t, { primary: creator });
    expect(creator.createRootBoard).toHaveBeenCalledWith('My Board', undefined);
  });

  it('calls createColumn for each column', async () => {
    const creator = mockCreator();
    const t = TemplateSchema.parse({
      version: 1,
      board: { title: 'B', columns: [{ title: 'A', cards: [] }, { title: 'B', cards: [] }] },
    });
    await createFromTemplate(t, { primary: creator });
    expect(creator.createColumn).toHaveBeenCalledTimes(2);
  });

  it('calls createCard for each primitive card', async () => {
    const creator = mockCreator();
    const t = TemplateSchema.parse({
      version: 1,
      board: {
        title: 'B',
        columns: [
          {
            title: 'Col',
            cards: [
              { type: 'note', text: 'hi' },
              { type: 'swatch', hex: '#FF0000' },
            ],
          },
        ],
      },
    });
    await createFromTemplate(t, { primary: creator });
    expect(creator.createCard).toHaveBeenCalledTimes(2);
  });

  it('recurses into subboards', async () => {
    const creator = mockCreator();
    const t = TemplateSchema.parse({
      version: 1,
      board: {
        title: 'Root',
        freeform: [
          {
            type: 'board',
            title: 'Sub',
            freeform: [{ type: 'note', text: 'deep note' }],
          },
        ],
      },
    });
    await createFromTemplate(t, { primary: creator });
    expect(creator.createSubboard).toHaveBeenCalledWith(expect.anything(), null, 'Sub', undefined);
    // The note inside the subboard should also be created
    expect(creator.createCard).toHaveBeenCalledTimes(1);
  });

  it('falls back to secondary creator when primary throws', async () => {
    const err = new Error('api offline');
    const primary = mockCreator({
      createRootBoard: vi.fn().mockRejectedValue(err),
    });
    const fallback = mockCreator();
    const t = TemplateSchema.parse({ version: 1, board: { title: 'T' } });
    await createFromTemplate(t, { primary, fallback });
    expect(fallback.createRootBoard).toHaveBeenCalledWith('T', undefined);
  });

  it('throws OrchestratorError when both primary and fallback fail', async () => {
    const err = new Error('dead');
    const primary = mockCreator({ createRootBoard: vi.fn().mockRejectedValue(err) });
    const fallback = mockCreator({ createRootBoard: vi.fn().mockRejectedValue(err) });
    const t = TemplateSchema.parse({ version: 1, board: { title: 'T' } });
    await expect(createFromTemplate(t, { primary, fallback })).rejects.toThrow(OrchestratorError);
  });

  it('returns the root board ref', async () => {
    const creator = mockCreator();
    const t = TemplateSchema.parse({ version: 1, board: { title: 'T' } });
    const ref = await createFromTemplate(t, { primary: creator });
    expect(ref.id).toMatch(/^board-/);
  });
});

// ── circular variable cycle detection ────────────────────────────────────────

describe('circular variable detection', () => {
  it('throws VariableResolutionError on direct cycle (a → a)', () => {
    expect(() =>
      substitute('{{a}}', { declared: { a: '{{a}}' } }),
    ).toThrow(VariableResolutionError);
  });

  it('throws on indirect cycle (a → b → a)', () => {
    expect(() =>
      substitute('{{a}}', { declared: { a: '{{b}}', b: '{{a}}' } }),
    ).toThrow(VariableResolutionError);
  });

  it('allows non-cyclic chaining (a → b → literal)', () => {
    const result = substitute('{{a}}', { declared: { a: '{{b}}', b: 'hello' } });
    expect(result).toBe('hello');
  });
});
