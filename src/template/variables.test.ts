/**
 * @file variables.test.ts
 * @description Tests for {{variable}} substitution — env vars, overrides, resolveTree
 * @version 0.1.0
 * @created 2026-05-03T00:00:00Z
 * @lastUpdated 2026-05-03T00:00:00Z
 */

import { describe, it, expect } from 'vitest';
import { substitute, resolveTree, VariableResolutionError } from './variables.js';

describe('substitute — env variables', () => {
  it('resolves {{env.NAME}} from provided env', () => {
    const result = substitute('Hello {{env.OWNER}}', { env: { OWNER: 'romar' } });
    expect(result).toBe('Hello romar');
  });

  it('throws VariableResolutionError for unset {{env.NAME}}', () => {
    expect(() => substitute('{{env.MISSING}}', { env: {} })).toThrow(VariableResolutionError);
  });

  it('returns empty string for optional {{env.NAME?}} when unset', () => {
    const result = substitute('x{{env.MISSING?}}y', { env: {} });
    expect(result).toBe('xy');
  });

  it('returns value for optional {{env.NAME?}} when set', () => {
    const result = substitute('{{env.FOO?}}', { env: { FOO: 'bar' } });
    expect(result).toBe('bar');
  });
});

describe('substitute — overrides vs declared', () => {
  it('uses declared default when no override given', () => {
    const result = substitute('{{x}}', { declared: { x: 'default' } });
    expect(result).toBe('default');
  });

  it('override wins over declared default', () => {
    const result = substitute('{{x}}', {
      declared: { x: 'default' },
      overrides: { x: 'override' },
    });
    expect(result).toBe('override');
  });

  it('throws VariableResolutionError for undeclared variable', () => {
    expect(() => substitute('{{nope}}', {})).toThrow(VariableResolutionError);
  });

  it('resolves chained variable references (a → b → literal)', () => {
    const result = substitute('{{a}}', { declared: { a: '{{b}}', b: 'final' } });
    expect(result).toBe('final');
  });
});

describe('substitute — multiple markers in one string', () => {
  it('replaces all occurrences', () => {
    const result = substitute('{{x}}-{{x}}-{{y}}', {
      declared: { x: 'A', y: 'B' },
    });
    expect(result).toBe('A-A-B');
  });

  it('handles marker with surrounding whitespace', () => {
    const result = substitute('{{ x }}', { declared: { x: 'trimmed' } });
    expect(result).toBe('trimmed');
  });
});

describe('resolveTree', () => {
  it('substitutes in a flat object', () => {
    const result = resolveTree({ title: '{{x}}' }, { declared: { x: 'hello' } });
    expect(result).toEqual({ title: 'hello' });
  });

  it('substitutes recursively in nested objects', () => {
    const result = resolveTree(
      { a: { b: '{{x}}' } },
      { declared: { x: 'deep' } },
    );
    expect((result as { a: { b: string } }).a.b).toBe('deep');
  });

  it('substitutes in arrays', () => {
    const result = resolveTree(['{{x}}', '{{y}}'], { declared: { x: '1', y: '2' } });
    expect(result).toEqual(['1', '2']);
  });

  it('passes through numbers and booleans unchanged', () => {
    const result = resolveTree({ n: 42, b: true }, {});
    expect(result).toEqual({ n: 42, b: true });
  });

  it('passes through null unchanged', () => {
    expect(resolveTree(null, {})).toBeNull();
  });
});
