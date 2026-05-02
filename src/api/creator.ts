/**
 * @file creator.ts
 * @description ApiCreator — creates Milanote elements via REST POST /api/elements
 * @version 0.2.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-05-02T16:25:20Z
 *
 * Discovery source: static analysis of Milanote Web Clipper v2.3.7
 * (knowledge/milanote/reference/api/web-clipper-api.md)
 *
 * The clipper uses POST /api/elements with { elements: [...], tokens: <perm-token> }.
 * This is simpler than Socket.IO and uses the existing MilanoteClient HTTP stack.
 *
 * Still stubbed (no probe data yet): createRootBoard, createColumn, createSubboard.
 */

import type { Card } from '../template/schema.js';
import type { BoardRef, CardRef, ColumnRef, Creator } from '../creator/types.js';
import { NotImplementedError } from '../creator/types.js';
import type { MilanoteClient } from './client.js';

const BOARD_STUB_HINT =
  'Board/Column creation via REST not yet mapped. Run a probe session with ' +
  '--reload while creating a board and column, then promote shapes to ' +
  'knowledge/milanote/reference/api/ and implement here.';

/** Client-side element ID matching the format observed in probe: ~14 alphanumeric chars */
function generateElementId(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Minimal Tiptap document wrapping plain text, as used by the Web Clipper for CARD elements */
function tiptapDoc(text: string): object {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text }],
      },
    ],
  };
}

interface ElementsResponse {
  elements?: Array<{ _id?: string; id?: string }>;
}

interface PermissionsTokenResponse {
  token: string;
}

export class ApiCreator implements Creator {
  readonly strategy = 'api' as const;

  constructor(private readonly client: MilanoteClient) {}

  async createRootBoard(_title: string, _description?: string): Promise<BoardRef> {
    void _title;
    void _description;
    throw new NotImplementedError('ApiCreator.createRootBoard', BOARD_STUB_HINT);
  }

  async createColumn(_parent: BoardRef, _title: string): Promise<ColumnRef> {
    void _parent;
    void _title;
    throw new NotImplementedError('ApiCreator.createColumn', BOARD_STUB_HINT);
  }

  async createCard(
    parent: BoardRef,
    _column: ColumnRef | null,
    card: Exclude<Card, { type: 'board' }>,
  ): Promise<CardRef> {
    void _column;

    // Get permissions token for the parent board
    const { token } = await this.client.getJson<PermissionsTokenResponse>(
      `/api/permissions/token?ids=${parent.id}`,
    );

    const clientId = generateElementId();
    let element: Record<string, unknown>;

    switch (card.type) {
      case 'note':
        element = {
          elementType: 'CARD',
          clientId,
          parentId: parent.id,
          text: tiptapDoc(card.text),
        };
        break;

      case 'link':
        element = {
          elementType: 'LINK',
          clientId,
          parentId: parent.id,
          url: card.url,
          ...(card.title ? { title: card.title } : {}),
          ...(card.description ? { description: card.description } : {}),
        };
        break;

      case 'checklist':
        element = {
          elementType: 'TASK_LIST',
          clientId,
          parentId: parent.id,
          ...(card.title ? { title: card.title } : {}),
          items: card.items.map((item) => ({
            text: item.text,
            checked: item.done ?? false,
          })),
        };
        break;

      case 'image':
        element = {
          elementType: 'IMAGE',
          clientId,
          parentId: parent.id,
          url: card.src,
          ...(card.caption ? { caption: card.caption } : {}),
        };
        break;

      case 'swatch':
        element = {
          elementType: 'SWATCH',
          clientId,
          parentId: parent.id,
          color: card.hex,
          ...(card.label ? { label: card.label } : {}),
        };
        break;

      case 'file':
        throw new NotImplementedError(
          'ApiCreator.createCard(file)',
          'File upload requires a 3-step flow: POST /api/upload/sign → PUT <signed-url> → POST /api/elements. Not yet implemented.',
        );

      default: {
        const exhaustive: never = card;
        throw new Error(`Unknown card type: ${(exhaustive as Card).type}`);
      }
    }

    const resp = await this.client.postJson<ElementsResponse>('/api/elements', {
      elements: [element],
      tokens: token,
    });

    const created = resp.elements?.[0];
    const id = created?._id ?? created?.id ?? clientId;
    return { id, type: card.type };
  }

  async createSubboard(
    _parent: BoardRef,
    _column: ColumnRef | null,
    _title: string,
    _description?: string,
  ): Promise<BoardRef> {
    void _parent;
    void _column;
    void _title;
    void _description;
    throw new NotImplementedError('ApiCreator.createSubboard', BOARD_STUB_HINT);
  }
}
