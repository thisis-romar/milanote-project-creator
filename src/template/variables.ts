/**
 * @file variables.ts
 * @description {{variable}} substitution for board templates
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 *
 * Substitution applies POST-JSON-parse so variable values can contain any
 * characters (including quotes, braces) without breaking JSON parsing.
 *
 * Forms:
 *   {{varName}}     — looked up in `variables` block (or CLI overrides)
 *   {{env.NAME}}    — looked up in process.env
 *   {{env.NAME?}}   — same, but empty string if unset (no error)
 */

import type { VariableSpecT } from './schema.js';

const VAR_PATTERN = /\{\{\s*([^}]+?)\s*\}\}/g;

export interface ResolveOptions {
  /** From the template's `variables` block */
  declared?: Record<string, VariableSpecT>;
  /** From CLI `--var k=v` flags or runtime overrides */
  overrides?: Record<string, string>;
  /** Defaults to process.env */
  env?: NodeJS.ProcessEnv;
}

export class VariableResolutionError extends Error {
  constructor(
    public readonly varName: string,
    message: string,
  ) {
    super(message);
    this.name = 'VariableResolutionError';
  }
}

function lookup(name: string, opts: ResolveOptions): string {
  const env = opts.env ?? process.env;

  if (name.startsWith('env.')) {
    const optional = name.endsWith('?');
    const envName = name.slice(4, optional ? -1 : undefined);
    const v = env[envName];
    if (v === undefined) {
      if (optional) return '';
      throw new VariableResolutionError(name, `environment variable not set: ${envName}`);
    }
    return v;
  }

  // Override wins over declared default
  if (opts.overrides && name in opts.overrides) {
    const v = opts.overrides[name];
    if (v !== undefined) return v;
  }

  const declared = opts.declared?.[name];
  if (declared !== undefined) {
    if (typeof declared === 'string') return declared;
    return declared.default;
  }

  throw new VariableResolutionError(name, `undeclared variable: ${name}`);
}

export function substitute(input: string, opts: ResolveOptions): string {
  return input.replace(VAR_PATTERN, (_, raw: string) => lookup(raw.trim(), opts));
}

/**
 * Walk an arbitrary parsed-JSON tree and replace `{{var}}` placeholders in every string value.
 * Object keys are NOT substituted — only values.
 */
export function resolveTree<T>(node: T, opts: ResolveOptions): T {
  if (typeof node === 'string') {
    return substitute(node, opts) as T;
  }
  if (Array.isArray(node)) {
    return node.map((n) => resolveTree(n, opts)) as unknown as T;
  }
  if (node !== null && typeof node === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      result[k] = resolveTree(v, opts);
    }
    return result as T;
  }
  return node;
}
