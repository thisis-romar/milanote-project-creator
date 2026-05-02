/**
 * @file creator.ts
 * @description ApiCreator — creates Milanote elements via Socket.IO v4 collab server
 * @version 0.3.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-05-02T17:30:00Z
 *
 * All element creation goes through CollabSocket (Socket.IO v4 on
 * wss://app.milanote.com/socket.io/). REST POST /api/elements was tried first
 * but returns null permissions tokens for workspace root boards under cookie auth.
 * Socket.IO bypasses the permissions token requirement entirely.
 *
 * Confirmed working: BOARD, COLUMN, CARD, LINK, TASK_LIST, TASK, IMAGE, SWATCH
 * Not yet implemented: FILE (needs signed upload flow)
 */

import type { Card } from '../template/schema.js';
import type { BoardRef, CardRef, ColumnRef, Creator } from '../creator/types.js';
import { NotImplementedError } from '../creator/types.js';
import type { MilanoteClient } from './client.js';
import type { CollabSocket } from './collab-socket.js';
import { generateElementId as genSocketId } from './collab-socket.js';

interface ElementsResponse {
  elements?: Array<{ _id?: string; id?: string }>;
}

interface PermissionsTokenResponse {
  token: string;
}

export class ApiCreator implements Creator {
  readonly strategy = 'api' as const;

  /**
   * @param client — rate-limited HTTP client with Milanote session cookies
   * @param workspaceBoardId — the home/workspace board ID (from page URL or --workspace flag)
   * @param socket — optional CollabSocket for operations that need Socket.IO (board/column creation)
   */
  constructor(
    private readonly client: MilanoteClient,
    private readonly workspaceBoardId?: string,
    private readonly socket?: CollabSocket,
  ) {}

  // ── Position tracking per board ─────────────────────────────────────────────
  // Milanote positions use {x, y, score} for CANVAS items.
  // score is used for z-order/sort; we increment by 65536 per item.
  // Columns are laid out horizontally at ~280px intervals.
  // Freeform items (subboards, loose cards) go below columns.

  private readonly columnIndex = new Map<string, number>();
  private readonly freeformIndex = new Map<string, number>();
  private readonly columnItemIndex = new Map<string, number>(); // per-column card index

  // Milanote canvas coordinate system: 1 canvas unit ≈ 7 screen pixels at 100% zoom.
  // Element widths in canvas units: column ~39, subboard ~33, swatch ~13.
  // Use tight spacing to avoid large gaps.

  private nextColumnPos(boardId: string): { x: number; y: number; score: number } {
    const i = this.columnIndex.get(boardId) ?? 0;
    this.columnIndex.set(boardId, i + 1);
    // ~40 canvas units per column (~280px at 100% zoom — matches column visual width + gap)
    return { x: i * 40, y: 0, score: (i + 1) * 65536 };
  }

  private nextFreeformPos(
    boardId: string,
    opts: { colWidth?: number; rowHeight?: number; startY?: number } = {},
  ): { x: number; y: number; score: number } {
    const i = this.freeformIndex.get(boardId) ?? 0;
    this.freeformIndex.set(boardId, i + 1);
    const colWidth = opts.colWidth ?? 40;    // ~280px per subboard slot
    const rowHeight = opts.rowHeight ?? 30;  // ~210px per row
    const startY = opts.startY ?? 60;        // ~420px below column row
    const col = i % 3;
    const row = Math.floor(i / 3);
    return { x: col * colWidth, y: startY + row * rowHeight, score: (i + 1) * 65536 };
  }

  private nextSwatchPos(boardId: string): { x: number; y: number; score: number } {
    // Swatches are ~90px wide (~13 canvas units) — tight horizontal row
    return this.nextFreeformPos(boardId, { colWidth: 15, rowHeight: 18, startY: 5 });
  }

  private nextColumnItemIndex(columnId: string): number {
    const i = this.columnItemIndex.get(columnId) ?? 0;
    this.columnItemIndex.set(columnId, i + 1);
    return i;
  }

  private async permToken(boardId: string): Promise<string> {
    const resp = await this.client.getJson<PermissionsTokenResponse>(
      `/api/permissions/token?ids=${boardId}`,
    );
    return resp.token;
  }

  private async createElement(
    parentId: string,
    token: string,
    element: Record<string, unknown>,
  ): Promise<string> {
    const resp = await this.client.postJson<ElementsResponse>('/api/elements', {
      elements: [element],
      tokens: token,
    });
    return resp.elements?.[0]?._id ?? resp.elements?.[0]?.id ?? (element.clientId as string);
  }

  async createRootBoard(title: string, description?: string): Promise<BoardRef> {
    const parentId = this.workspaceBoardId;
    if (!parentId || !this.socket) {
      throw new NotImplementedError(
        'ApiCreator.createRootBoard',
        'Pass --workspace <home-board-id> and ensure CollabSocket is connected.',
      );
    }
    await this.socket.navigate(parentId);
    const id = genSocketId();
    await this.socket.createElement(parentId, id, 'BOARD', {
      title,
      ...(description ? { description } : {}),
    });
    // Wait for server to register the new board before we create children inside it
    await new Promise((r) => setTimeout(r, 800));
    return { id, url: `https://app.milanote.com/${id}/` };
  }

  async createColumn(parent: BoardRef, title: string): Promise<ColumnRef> {
    if (!this.socket) {
      throw new NotImplementedError('ApiCreator.createColumn', 'CollabSocket required for column creation.');
    }
    await this.socket.navigate(parent.id);
    const id = genSocketId();
    const pos = this.nextColumnPos(parent.id);
    await this.socket.createElement(parent.id, id, 'COLUMN', { title }, pos);
    return { id };
  }

  async createCard(
    parent: BoardRef,
    column: ColumnRef | null,
    card: Exclude<Card, { type: 'board' }>,
  ): Promise<CardRef> {
    if (!this.socket) {
      throw new NotImplementedError('ApiCreator.createCard', 'CollabSocket required for card creation.');
    }

    // Navigate to the board that owns this element so the server has a channel subscription.
    // For freeform cards in a subboard, parent.id IS the subboard.
    await this.socket.navigate(parent.id);

    // Cards inside a column are children of the column (INBOX section),
    // not children of the board (CANVAS section).
    const containerId = column?.id ?? parent.id;
    const inColumn = !!column;

    // Position helpers: column items use INBOX sequential index; freeform gets canvas coords.
    const colItemScore = inColumn ? this.nextColumnItemIndex(containerId) : 0;
    const pos = (isSwatchLayout = false) => {
      if (inColumn) return { x: 0, y: 0, score: colItemScore };
      return isSwatchLayout
        ? this.nextSwatchPos(parent.id)
        : this.nextFreeformPos(parent.id);
    };

    const id = genSocketId();

    switch (card.type) {
      case 'note':
        await this.socket.createElement(containerId, id, 'CARD', { textContent: card.text }, pos(), inColumn);
        break;

      case 'link':
        await this.socket.createElement(containerId, id, 'LINK', {
          url: card.url,
          ...(card.title ? { title: card.title } : {}),
          ...(card.description ? { description: card.description } : {}),
        }, pos(), inColumn);
        // ELEMENT_UPDATE with data wrapper to ensure URL persists (confirmed bundle format)
        await this.socket.updateElement(parent.id, id, {
          url: card.url,
          ...(card.title ? { title: card.title } : {}),
          ...(card.description ? { description: card.description } : {}),
        });
        break;

      case 'checklist': {
        await this.socket.createElement(containerId, id, 'TASK_LIST', {
          title: card.title ?? null,
          showTitle: !!card.title,
        }, pos(), inColumn);
        let taskIdx = 0;
        for (const item of card.items) {
          const taskId = genSocketId();
          await this.socket.createElement(id, taskId, 'TASK', {
            textContent: item.text,
            checked: item.done ?? false,
          }, { x: 0, y: 0, score: taskIdx++ });
        }
        break;
      }

      case 'image':
        await this.socket.createElement(containerId, id, 'IMAGE', {
          url: card.src,
          ...(card.caption ? { caption: card.caption } : {}),
        }, pos(), inColumn);
        break;

      case 'swatch':
        // COLOR_SWATCH is ~90px wide — use tight horizontal layout when freeform
        await this.socket.createElement(containerId, id, 'COLOR_SWATCH', {
          color: card.hex,
          ...(card.label ? { label: card.label } : {}),
        }, pos(true), inColumn);
        break;

      case 'file':
        throw new NotImplementedError(
          'ApiCreator.createCard(file)',
          'File upload not yet implemented.',
        );

      default: {
        const exhaustive: never = card;
        throw new Error(`Unknown card type: ${(exhaustive as Card).type}`);
      }
    }

    return { id, type: card.type };
  }

  async createSubboard(
    parent: BoardRef,
    _column: ColumnRef | null,
    title: string,
    description?: string,
  ): Promise<BoardRef> {
    void _column;
    if (!this.socket) {
      throw new NotImplementedError('ApiCreator.createSubboard', 'CollabSocket required for subboard creation.');
    }
    await this.socket.navigate(parent.id);
    const id = genSocketId();
    const pos = this.nextFreeformPos(parent.id);
    await this.socket.createElement(parent.id, id, 'BOARD', {
      title,
      ...(description ? { description } : {}),
    }, pos);
    // Wait for server to register new board before creating children inside it
    await new Promise((r) => setTimeout(r, 800));
    return { id, url: `https://app.milanote.com/${id}/` };
  }
}
