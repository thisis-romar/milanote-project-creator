/**
 * @file plan.ts
 * @description Build a flat step-by-step plan from a parsed template — used by --dry-run and live progress
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import chalk from 'chalk';
import type { Card, Column, Template } from '../template/schema.js';

export type PlanStepKind = 'board' | 'subboard' | 'column' | 'freeform' | 'card';

export interface PlanStep {
  kind: PlanStepKind;
  cardType?: Card['type'];
  title: string;
  detail?: string;
  depth: number;
}

interface BoardLike {
  title: string;
  description?: string;
  columns?: Column[];
  freeform?: Card[];
}

export function buildPlan(template: Template): PlanStep[] {
  const steps: PlanStep[] = [];
  const visitBoard = (board: BoardLike, depth: number, isRoot: boolean): void => {
    steps.push({
      kind: isRoot ? 'board' : 'subboard',
      title: board.title,
      detail: board.description,
      depth,
    });
    if (board.columns) {
      for (const col of board.columns) {
        steps.push({ kind: 'column', title: col.title, depth: depth + 1 });
        for (const card of col.cards) visitCard(card, depth + 2);
      }
    }
    if (board.freeform && board.freeform.length > 0) {
      steps.push({ kind: 'freeform', title: '<canvas>', depth: depth + 1 });
      for (const card of board.freeform) visitCard(card, depth + 2);
    }
  };
  const visitCard = (card: Card, depth: number): void => {
    if (card.type === 'board') {
      visitBoard(card, depth, false);
    } else {
      steps.push({ kind: 'card', cardType: card.type, title: cardTitle(card), depth });
    }
  };
  visitBoard(template.board, 0, true);
  return steps;
}

function cardTitle(card: Exclude<Card, { type: 'board' }>): string {
  switch (card.type) {
    case 'note':
      return truncate(card.text, 60);
    case 'link':
      return card.title ?? card.url;
    case 'image':
      return card.caption ?? card.src;
    case 'file':
      return card.path;
    case 'swatch':
      return `${card.hex}${card.label ? ' ' + card.label : ''}`;
    case 'checklist':
      return `${card.title ?? '(checklist)'} - ${card.items.length} items`;
  }
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

export function printPlan(steps: PlanStep[]): void {
  for (const s of steps) {
    const indent = '  '.repeat(s.depth);
    const arrow = chalk.dim('→');
    const kind =
      s.kind === 'board'
        ? chalk.bold.magenta('board')
        : s.kind === 'subboard'
          ? chalk.magenta('subboard')
          : s.kind === 'column'
            ? chalk.blue('column')
            : s.kind === 'freeform'
              ? chalk.blue('freeform')
              : chalk.green(`card[${s.cardType}]`);
    let line = `${indent}${arrow} ${kind} ${chalk.cyan(s.title)}`;
    if (s.detail) line += chalk.dim(` — ${s.detail}`);
    console.log(line);
  }
}

export function summarize(steps: PlanStep[]): string {
  const counts: Record<string, number> = {};
  for (const s of steps) {
    const key = s.cardType ?? s.kind;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
}
