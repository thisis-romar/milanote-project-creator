/**
 * @file parser.test.ts
 * @description Tests for parseTemplate — file I/O, schema validation, variable resolution
 * @version 0.1.0
 * @created 2026-05-03T00:00:00Z
 * @lastUpdated 2026-05-03T00:00:00Z
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseTemplate, TemplateParseError } from './parser.js';
import { VariableResolutionError } from './variables.js';

vi.mock('node:fs/promises');
import { readFile } from 'node:fs/promises';
const mockRead = vi.mocked(readFile);

const write = (obj: unknown) => mockRead.mockResolvedValue(JSON.stringify(obj) as never);

beforeEach(() => vi.clearAllMocks());

describe('parseTemplate — error paths', () => {
  it('throws TemplateParseError on JSON syntax error', async () => {
    mockRead.mockResolvedValue('{ bad json' as never);
    await expect(parseTemplate('t.json')).rejects.toThrow(TemplateParseError);
  });

  it('sets templatePath on TemplateParseError', async () => {
    mockRead.mockResolvedValue('bad' as never);
    await expect(parseTemplate('/some/path.json')).rejects.toMatchObject({
      templatePath: '/some/path.json',
    });
  });

  it('throws TemplateParseError when required board field is missing', async () => {
    write({ version: 1 }); // missing `board`
    await expect(parseTemplate('t.json')).rejects.toThrow(TemplateParseError);
  });

  it('includes Zod issue paths in the issues array', async () => {
    write({ version: 1 }); // missing `board`
    try {
      await parseTemplate('t.json');
    } catch (e) {
      expect(e).toBeInstanceOf(TemplateParseError);
      expect((e as TemplateParseError).issues.length).toBeGreaterThan(0);
    }
  });

  it('throws VariableResolutionError for an undeclared variable', async () => {
    // parser does not wrap VariableResolutionError — it propagates as-is
    write({ version: 1, board: { title: '{{ghost}} Board' } });
    await expect(parseTemplate('t.json')).rejects.toThrow(VariableResolutionError);
  });

  it('throws when board nesting exceeds MAX_BOARD_DEPTH — needs depth 6', async () => {
    // checkBoardDepth throws when depth > 5; root freeform starts at depth 1,
    // so we need boards L1…L6 (6 nested boards) to reach depth 6
    write({
      version: 1,
      board: {
        title: 'L0',
        freeform: [{
          type: 'board', title: 'L1',
          freeform: [{
            type: 'board', title: 'L2',
            freeform: [{
              type: 'board', title: 'L3',
              freeform: [{
                type: 'board', title: 'L4',
                freeform: [{
                  type: 'board', title: 'L5',
                  freeform: [{
                    type: 'board', title: 'L6-too-deep',
                  }],
                }],
              }],
            }],
          }],
        }],
      },
    });
    await expect(parseTemplate('t.json')).rejects.toThrow();
  });
});

describe('parseTemplate — happy paths', () => {
  it('returns a validated Template for a minimal board', async () => {
    write({ version: 1, board: { title: 'Hello' } });
    const result = await parseTemplate('t.json');
    expect(result.board.title).toBe('Hello');
    expect(result.version).toBe(1);
  });

  it('applies template variable defaults', async () => {
    write({
      version: 1,
      variables: { name: 'Default' },
      board: { title: '{{name}} Board' },
    });
    const result = await parseTemplate('t.json');
    expect(result.board.title).toBe('Default Board');
  });

  it('CLI overrides win over template defaults', async () => {
    write({
      version: 1,
      variables: { name: 'Default' },
      board: { title: '{{name}} Board' },
    });
    const result = await parseTemplate('t.json', { overrides: { name: 'Override' } });
    expect(result.board.title).toBe('Override Board');
  });

  it('preserves columns and cards after parse', async () => {
    write({
      version: 1,
      board: {
        title: 'B',
        columns: [{ title: 'Col', cards: [{ type: 'note', text: 'hi' }] }],
      },
    });
    const result = await parseTemplate('t.json');
    expect(result.board.columns?.[0].title).toBe('Col');
    expect(result.board.columns?.[0].cards?.[0]).toMatchObject({ type: 'note', text: 'hi' });
  });
});
