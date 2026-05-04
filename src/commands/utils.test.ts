/**
 * @file utils.test.ts
 * @description Tests for shared command utilities
 * @version 0.1.0
 * @created 2026-05-04T00:00:00Z
 * @lastUpdated 2026-05-04T00:00:00Z
 */

import { describe, it, expect } from 'vitest';
import { parseVarFlags } from './utils.js';

describe('parseVarFlags', () => {
  it('returns empty object for undefined', () => {
    expect(parseVarFlags(undefined)).toEqual({});
  });

  it('returns empty object for empty array', () => {
    expect(parseVarFlags([])).toEqual({});
  });

  it('parses a single key=value pair', () => {
    expect(parseVarFlags(['name=Alice'])).toEqual({ name: 'Alice' });
  });

  it('parses multiple pairs', () => {
    expect(parseVarFlags(['a=1', 'b=2'])).toEqual({ a: '1', b: '2' });
  });

  it('splits only on the first = (value may contain =)', () => {
    expect(parseVarFlags(['url=https://example.com?a=1&b=2'])).toEqual({
      url: 'https://example.com?a=1&b=2',
    });
  });

  it('allows empty value (key=)', () => {
    expect(parseVarFlags(['key='])).toEqual({ key: '' });
  });

  it('throws for a flag without =', () => {
    expect(() => parseVarFlags(['noequals'])).toThrow('Invalid --var');
  });

  it('last writer wins for duplicate keys', () => {
    expect(parseVarFlags(['k=first', 'k=second'])).toEqual({ k: 'second' });
  });
});
