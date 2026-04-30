/**
 * @file validate.ts
 * @description `milanote-creator validate <template.json>` command
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { parseTemplate, TemplateParseError } from '../template/parser.js';
import type { Card, Template } from '../template/schema.js';

interface ValidateOptions {
  var?: string[];
}

function parseVarFlags(values: string[] | undefined): Record<string, string> {
  if (!values) return {};
  const out: Record<string, string> = {};
  for (const v of values) {
    const eq = v.indexOf('=');
    if (eq < 0) throw new Error(`Invalid --var (expected key=value): ${v}`);
    out[v.slice(0, eq)] = v.slice(eq + 1);
  }
  return out;
}

export function registerValidateCommand(program: Command): void {
  program
    .command('validate <template>')
    .description('Validate a template JSON against the schema (with variable resolution)')
    .option('--var <key=value...>', 'override a template variable', (val: string, prev: string[] = []) => [...prev, val])
    .action(async (template: string, opts: ValidateOptions) => {
      const overrides = parseVarFlags(opts.var);
      try {
        const result = await parseTemplate(template, { overrides });
        const stats = countNodes(result);
        console.log(chalk.green('✓ Valid'));
        console.log(`  Title:     ${result.board.title}`);
        console.log(`  Columns:   ${stats.columns}`);
        console.log(`  Cards:     ${stats.cards}`);
        console.log(`  By type:   ${formatByType(stats.byType)}`);
        if (stats.boards > 1) console.log(`  Subboards: ${stats.boards - 1}`);
      } catch (e) {
        if (e instanceof TemplateParseError) {
          console.error(chalk.red(`✗ ${e.message}`));
          for (const issue of e.issues) console.error(`  ${issue}`);
          process.exitCode = 1;
          return;
        }
        throw e;
      }
    });
}

interface NodeStats {
  columns: number;
  cards: number;
  boards: number;
  byType: Record<string, number>;
}

function countNodes(template: Template): NodeStats {
  const stats: NodeStats = { columns: 0, cards: 0, boards: 1, byType: {} };
  const visitCards = (cards: Card[] | undefined): void => {
    if (!cards) return;
    for (const c of cards) {
      stats.cards += 1;
      stats.byType[c.type] = (stats.byType[c.type] ?? 0) + 1;
      if (c.type === 'board') {
        stats.boards += 1;
        visitCards(c.freeform);
        if (c.columns) {
          for (const col of c.columns) {
            stats.columns += 1;
            visitCards(col.cards);
          }
        }
      }
    }
  };
  if (template.board.columns) {
    for (const col of template.board.columns) {
      stats.columns += 1;
      visitCards(col.cards);
    }
  }
  visitCards(template.board.freeform);
  return stats;
}

function formatByType(byType: Record<string, number>): string {
  return Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
}
