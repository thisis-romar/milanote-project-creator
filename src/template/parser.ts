/**
 * @file parser.ts
 * @description Load, validate, and resolve variables in a board template JSON file
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import { readFile } from 'node:fs/promises';
import { ZodError } from 'zod';
import { TemplateSchema, checkBoardDepth, type Template } from './schema.js';
import { resolveTree, type ResolveOptions } from './variables.js';

export interface ParseOptions {
  /** CLI `--var k=v` overrides (wins over template `variables` defaults) */
  overrides?: Record<string, string>;
  /** Defaults to process.env */
  env?: NodeJS.ProcessEnv;
}

export class TemplateParseError extends Error {
  constructor(
    public readonly templatePath: string,
    public readonly issues: string[],
    message: string,
  ) {
    super(message);
    this.name = 'TemplateParseError';
  }
}

export async function parseTemplate(filePath: string, options: ParseOptions = {}): Promise<Template> {
  const raw = await readFile(filePath, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new TemplateParseError(filePath, [msg], `JSON syntax error in ${filePath}: ${msg}`);
  }

  // First validate the OUTER shape so we know `variables` block exists before substitution
  let outer: Template;
  try {
    outer = TemplateSchema.parse(parsed);
  } catch (e) {
    if (e instanceof ZodError) {
      const issues = e.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`);
      throw new TemplateParseError(filePath, issues, `schema validation failed for ${filePath}`);
    }
    throw e;
  }

  // Resolve variables on the validated tree (re-validate after substitution to catch
  // any constraints that depended on the substituted values, e.g. URL format).
  const resolveOpts: ResolveOptions = {
    declared: outer.variables,
    overrides: options.overrides,
    env: options.env,
  };
  const resolved = resolveTree(outer, resolveOpts);

  let final: Template;
  try {
    final = TemplateSchema.parse(resolved);
  } catch (e) {
    if (e instanceof ZodError) {
      const issues = e.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`);
      throw new TemplateParseError(
        filePath,
        issues,
        `schema validation failed AFTER variable substitution in ${filePath} — check that variable values are well-formed`,
      );
    }
    throw e;
  }

  checkBoardDepth(final);
  return final;
}
