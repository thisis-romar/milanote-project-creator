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
    return { id, url: `https://app.milanote.com/${id}/` };
  }

  async createColumn(parent: BoardRef, title: string): Promise<ColumnRef> {
    if (!this.socket) {
      throw new NotImplementedError('ApiCreator.createColumn', 'CollabSocket required for column creation.');
    }
    await this.socket.navigate(parent.id);
    const id = genSocketId();
    await this.socket.createElement(parent.id, id, 'COLUMN', { title });
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

    const id = genSocketId();

    switch (card.type) {
      case 'note':
        await this.socket.createElement(containerId, id, 'CARD', { textContent: card.text }, undefined, inColumn);
        break;

      case 'link':
        await this.socket.createElement(containerId, id, 'LINK', { url: null }, undefined, inColumn);
        // LINK content (url, title, description) must be set via ELEMENT_UPDATE after creation
        await this.socket.updateElement(parent.id, id, {
          content: {
            url: card.url,
            ...(card.title ? { title: card.title } : {}),
            ...(card.description ? { description: card.description } : {}),
          },
        });
        break;

      case 'checklist': {
        // TASK_LIST container inside the column, then TASK children inside the list
        await this.socket.createElement(containerId, id, 'TASK_LIST', {
          title: card.title ?? null,
          showTitle: !!card.title,
        }, undefined, inColumn);
        let idx = 0;
        for (const item of card.items) {
          const taskId = genSocketId();
          await this.socket.createElement(id, taskId, 'TASK', {
            textContent: item.text,
            checked: item.done ?? false,
          }, { x: 0, y: 0, score: idx++ });
        }
        break;
      }

      case 'image':
        await this.socket.createElement(containerId, id, 'IMAGE', {
          url: card.src,
          ...(card.caption ? { caption: card.caption } : {}),
        }, undefined, inColumn);
        break;

      case 'swatch':
        await this.socket.createElement(containerId, id, 'SWATCH', {
          color: card.hex,
          ...(card.label ? { label: card.label } : {}),
        }, undefined, inColumn);
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
    await this.socket.createElement(parent.id, id, 'BOARD', {
      title,
      ...(description ? { description } : {}),
    });
    return { id, url: `https://app.milanote.com/${id}/` };
  }
}
