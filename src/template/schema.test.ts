/**
 * @file schema.test.ts
 * @description Vitest unit tests for the template schema and variable resolution
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import { describe, it, expect } from 'vitest';
import { TemplateSchema, checkBoardDepth } from './schema.js';
import { resolveTree, substitute, VariableResolutionError } from './variables.js';
import { parseTemplate } from './parser.js';

describe('TemplateSchema', () => {
  it('accepts the minimum valid template', () => {
    const result = TemplateSchema.parse({
      version: 1,
      board: { title: 'Hello' },
    });
    expect(result.board.title).toBe('Hello');
  });

  it('defaults version to 1 when omitted', () => {
    const result = TemplateSchema.parse({ board: { title: 'X' } });
    expect(result.version).toBe(1);
  });

  it('rejects unknown card types', () => {
    expect(() =>
      TemplateSchema.parse({
        version: 1,
        board: {
          title: 'X',
          columns: [{ title: 'C', cards: [{ type: 'mystery', value: 1 }] }],
        },
      }),
    ).toThrow();
  });

  it('rejects malformed swatch hex', () => {
    expect(() =>
      TemplateSchema.parse({
        version: 1,
        board: {
          title: 'X',
          columns: [{ title: 'C', cards: [{ type: 'swatch', hex: 'red' }] }],
        },
      }),
    ).toThrow(/hex/);
  });

  it('accepts every primitive in one tree', () => {
    const t = TemplateSchema.parse({
      version: 1,
      board: {
        title: 'Full Coverage',
        columns: [
          {
            title: 'Mix',
            cards: [
              { type: 'note', text: 'hi' },
              { type: 'link', url: 'https://example.com' },
              { type: 'image', src: 'a.png', caption: 'cap' },
              { type: 'file', path: '/tmp/x.pdf' },
              { type: 'swatch', hex: '#FF5733' },
              { type: 'checklist', items: [{ text: 'todo' }] },
            ],
          },
        ],
        freeform: [
          {
            type: 'board',
            title: 'Sub',
            freeform: [{ type: 'note', text: 'nested' }],
          },
        ],
      },
    });
    expect(t.board.columns?.[0]?.cards).toHaveLength(6);
  });

  it('allows position on any card', () => {
    TemplateSchema.parse({
      version: 1,
      board: {
        title: 'Free',
        freeform: [{ type: 'note', text: 'x', position: { x: 10, y: 20 } }],
      },
    });
  });
});

describe('checkBoardDepth', () => {
  it('rejects boards nested deeper than 5', () => {
    let inner: unknown = { type: 'board', title: 'd6' };
    for (let i = 5; i >= 1; i--) {
      inner = { type: 'board', title: `d${i}`, freeform: [inner] };
    }
    const t = TemplateSchema.parse({
      version: 1,
      board: { title: 'root', freeform: [inner] },
    });
    expect(() => checkBoardDepth(t)).toThrow(/depth/);
  });

  it('accepts depth exactly 5', () => {
    let inner: unknown = { type: 'note', text: 'leaf' };
    for (let i = 5; i >= 1; i--) {
      inner = { type: 'board', title: `d${i}`, freeform: [inner] };
    }
    const t = TemplateSchema.parse({
      version: 1,
      board: { title: 'root', freeform: [inner] },
    });
    expect(() => checkBoardDepth(t)).not.toThrow();
  });
});

describe('substitute', () => {
  it('replaces declared variables', () => {
    expect(substitute('hi {{name}}', { declared: { name: 'world' } })).toBe('hi world');
  });

  it('replaces env.* references', () => {
    expect(substitute('{{env.USER_X?}}', { env: { USER_X: 'romar' } })).toBe('romar');
  });

  it('returns empty string for optional unset env', () => {
    expect(substitute('[{{env.MISSING?}}]', { env: {} })).toBe('[]');
  });

  it('throws on unset required env', () => {
    expect(() => substitute('{{env.REQUIRED}}', { env: {} })).toThrow(VariableResolutionError);
  });

  it('throws on undeclared variable', () => {
    expect(() => substitute('{{ghost}}', { declared: {} })).toThrow(VariableResolutionError);
  });

  it('overrides win over declared defaults', () => {
    const r = substitute('{{x}}', {
      declared: { x: 'default' },
      overrides: { x: 'override' },
    });
    expect(r).toBe('override');
  });

  it('uses default from object-form spec', () => {
    const r = substitute('{{x}}', { declared: { x: { default: 'd' } } });
    expect(r).toBe('d');
  });
});

describe('resolveTree', () => {
  it('walks objects, arrays, and strings', () => {
    const tree = {
      title: 'Project {{name}}',
      tags: ['{{tag1}}', 'static'],
      meta: { owner: '{{owner}}', count: 42 },
    };
    const out = resolveTree(tree, {
      overrides: { name: 'Voltura', tag1: 'design', owner: 'Romar' },
    });
    expect(out).toEqual({
      title: 'Project Voltura',
      tags: ['design', 'static'],
      meta: { owner: 'Romar', count: 42 },
    });
  });

  it('does not substitute object keys', () => {
    const out = resolveTree({ '{{key}}': 'value' }, { overrides: { key: 'X' } });
    expect(Object.keys(out)).toEqual(['{{key}}']);
  });
});

describe('parseTemplate (integration)', () => {
  it('loads, validates, and resolves the example template', async () => {
    const t = await parseTemplate('templates/sneaker-logo-design.json');
    expect(t.board.title).toContain('Voltura');
    const briefCol = t.board.columns?.find((c) => c.title === 'Brief');
    const briefNote = briefCol?.cards.find((c) => c.type === 'note');
    expect(briefNote && 'text' in briefNote && briefNote.text).toContain('Voltura');
  });

  it('honors --var overrides', async () => {
    const t = await parseTemplate('templates/sneaker-logo-design.json', {
      overrides: { brandName: 'Skylark' },
    });
    expect(t.board.title).toContain('Skylark');
  });
});
