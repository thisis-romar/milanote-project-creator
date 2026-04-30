/**
 * @file schema.ts
 * @description Zod schema for milanote-project-creator board templates
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 *
 * Covers every primitive shown in the official Milanote intro video
 * (see knowledge/milanote/reference/concepts/intro-video-2026-04-29.md):
 * board, nested board, note, link, image, file, swatch, checklist, column,
 * plus optional freeform x/y placement on any card.
 */

import { z } from 'zod';

const MAX_BOARD_DEPTH = 5;

const Position = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .strict();

const Note = z
  .object({
    type: z.literal('note'),
    text: z.string().min(1),
    position: Position.optional(),
  })
  .strict();

const Link = z
  .object({
    type: z.literal('link'),
    url: z.string().url(),
    title: z.string().optional(),
    description: z.string().optional(),
    position: Position.optional(),
  })
  .strict();

const ImageCard = z
  .object({
    type: z.literal('image'),
    src: z.string().min(1).describe('Local path or URL'),
    caption: z.string().optional(),
    position: Position.optional(),
  })
  .strict();

const FileCard = z
  .object({
    type: z.literal('file'),
    path: z.string().min(1),
    position: Position.optional(),
  })
  .strict();

const Swatch = z
  .object({
    type: z.literal('swatch'),
    hex: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'must be a 6-digit hex color, e.g. #FF5733'),
    label: z.string().optional(),
    position: Position.optional(),
  })
  .strict();

const ChecklistItem = z
  .object({
    text: z.string().min(1),
    done: z.boolean().optional(),
  })
  .strict();

const Checklist = z
  .object({
    type: z.literal('checklist'),
    title: z.string().optional(),
    items: z.array(ChecklistItem).min(1),
    position: Position.optional(),
  })
  .strict();

// ── Recursive Board card ─────────────────────────────────────────────────────
// Discriminated unions don't compose cleanly with z.lazy(), so we use z.union for the
// recursive Card type. Type narrowing still works at runtime via the `type` field.

export interface BoardCard {
  type: 'board';
  title: string;
  description?: string;
  columns?: Column[];
  freeform?: Card[];
  position?: z.infer<typeof Position>;
}

export interface Column {
  title: string;
  cards: Card[];
}

export type Card =
  | z.infer<typeof Note>
  | z.infer<typeof Link>
  | z.infer<typeof ImageCard>
  | z.infer<typeof FileCard>
  | z.infer<typeof Swatch>
  | z.infer<typeof Checklist>
  | BoardCard;

const BoardCardSchema: z.ZodType<BoardCard> = z.lazy(() =>
  z
    .object({
      type: z.literal('board'),
      title: z.string().min(1),
      description: z.string().optional(),
      columns: z.array(ColumnSchema).optional(),
      freeform: z.array(CardSchema).optional(),
      position: Position.optional(),
    })
    .strict(),
);

const CardSchema: z.ZodType<Card> = z.lazy(() =>
  z.union([Note, Link, ImageCard, FileCard, Swatch, Checklist, BoardCardSchema]),
);

const ColumnSchema: z.ZodType<Column> = z.lazy(() =>
  z
    .object({
      title: z.string().min(1),
      cards: z.array(CardSchema),
    })
    .strict(),
);

// ── Top-level template ───────────────────────────────────────────────────────

const VariableSpec = z.union([
  z.string(),
  z
    .object({
      default: z.string(),
      description: z.string().optional(),
    })
    .strict(),
]);

const RootBoard = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    columns: z.array(ColumnSchema).optional(),
    freeform: z.array(CardSchema).optional(),
  })
  .strict();

export const TemplateSchema = z
  .object({
    $schema: z.string().optional(),
    version: z.literal(1).default(1),
    variables: z.record(VariableSpec).optional(),
    board: RootBoard,
  })
  .strict();

export type Template = z.infer<typeof TemplateSchema>;
export type RootBoardT = z.infer<typeof RootBoard>;
export type VariableSpecT = z.infer<typeof VariableSpec>;

/**
 * Walk the parsed tree to confirm board nesting depth doesn't exceed MAX_BOARD_DEPTH.
 * Zod's recursive lazy types can't enforce this at parse time.
 */
export function checkBoardDepth(template: Template): void {
  // depth = nesting level of the board being checked, where the root is implicit (depth 0)
  // and direct children of root are depth 1. A board card at depth N > MAX is a violation.
  const visit = (cards: Card[] | undefined, depth: number): void => {
    if (!cards) return;
    for (const c of cards) {
      if (c.type === 'board') {
        if (depth > MAX_BOARD_DEPTH) {
          throw new Error(`Board nesting exceeds maximum depth of ${MAX_BOARD_DEPTH}`);
        }
        visit(c.freeform, depth + 1);
        if (c.columns) {
          for (const col of c.columns) visit(col.cards, depth + 1);
        }
      }
    }
  };
  visit(template.board.freeform, 1);
  if (template.board.columns) {
    for (const col of template.board.columns) visit(col.cards, 1);
  }
}
