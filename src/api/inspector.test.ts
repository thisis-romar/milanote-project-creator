/**
 * @file inspector.test.ts
 * @description Unit tests for assertNoDuplicate and verifyBoardCreation
 * @version 0.1.0
 * @created 2026-05-02T20:30:00Z
 * @lastUpdated 2026-05-02T20:30:00Z
 */

import { describe, it, expect, vi } from 'vitest';
import { assertNoDuplicate, verifyBoardCreation } from './inspector.js';
import type { MilanoteClient } from './client.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ElementEntry = {
  elementType?: string;
  content?: { title?: string };
  meta?: { createdTime?: number };
  location?: { parentId?: string };
};

function makeClient(elements: Record<string, ElementEntry> = {}): MilanoteClient {
  return {
    getJson: vi.fn().mockResolvedValue({ elements }),
  } as unknown as MilanoteClient;
}

function boardEl(title: string, parentId = 'workspace1'): ElementEntry {
  return {
    elementType: 'BOARD',
    content: { title },
    meta: { createdTime: Date.now() },
    location: { parentId },
  };
}

// ---------------------------------------------------------------------------

describe('assertNoDuplicate', () => {
  it('does not throw when the workspace has no boards', async () => {
    const client = makeClient({});
    await expect(assertNoDuplicate(client, 'workspace1', 'My Board', false)).resolves.toBeUndefined();
  });

  it('does not throw when no board has a matching title', async () => {
    const client = makeClient({
      board1: boardEl('Existing Board'),
      board2: boardEl('Another Board'),
    });
    await expect(assertNoDuplicate(client, 'workspace1', 'New Board', false)).resolves.toBeUndefined();
  });

  it('throws when a board with the same title exists (exact match)', async () => {
    const client = makeClient({ board1: boardEl('My Board') });
    await expect(assertNoDuplicate(client, 'workspace1', 'My Board', false))
      .rejects.toThrow('My Board');
  });

  it('throws on case-insensitive title match', async () => {
    const client = makeClient({ board1: boardEl('nomad av rack') });
    await expect(assertNoDuplicate(client, 'workspace1', 'Nomad AV Rack', false))
      .rejects.toThrow('Nomad AV Rack');
  });

  it('does not throw when force=true even if duplicate exists', async () => {
    const client = makeClient({ board1: boardEl('My Board') });
    await expect(assertNoDuplicate(client, 'workspace1', 'My Board', true)).resolves.toBeUndefined();
  });

  it('excludes the workspace board itself from the duplicate search', async () => {
    // The workspace board ID is filtered out, so it should never match
    const client = makeClient({ workspace1: boardEl('workspace1') });
    await expect(assertNoDuplicate(client, 'workspace1', 'workspace1', false)).resolves.toBeUndefined();
  });

  it('is advisory (no throw) when getJson fails', async () => {
    const client = {
      getJson: vi.fn().mockRejectedValue(new Error('network error')),
    } as unknown as MilanoteClient;
    await expect(assertNoDuplicate(client, 'workspace1', 'Any Title', false)).resolves.toBeUndefined();
  });

  it('error message includes the duplicate board URL', async () => {
    const client = makeClient({ boardXYZ: boardEl('Clash') });
    await expect(assertNoDuplicate(client, 'workspace1', 'Clash', false))
      .rejects.toThrow('app.milanote.com/boardXYZ');
  });

  it('error message includes --force hint', async () => {
    const client = makeClient({ boardXYZ: boardEl('Clash') });
    await expect(assertNoDuplicate(client, 'workspace1', 'Clash', false))
      .rejects.toThrow('--force');
  });
});

// ---------------------------------------------------------------------------

describe('verifyBoardCreation', () => {
  it('returns accessible=true and the element count on success', async () => {
    const client = makeClient({
      board1: boardEl('Root'),
      card1: { elementType: 'CARD' },
      card2: { elementType: 'CARD' },
    });
    const result = await verifyBoardCreation(client, 'board1');
    expect(result).toEqual({ accessible: true, count: 3 });
  });

  it('returns accessible=false and count=0 when getJson throws', async () => {
    const client = {
      getJson: vi.fn().mockRejectedValue(new Error('404')),
    } as unknown as MilanoteClient;
    const result = await verifyBoardCreation(client, 'missing-board');
    expect(result).toEqual({ accessible: false, count: 0 });
  });

  it('returns count=0 for an empty board', async () => {
    const client = makeClient({});
    const result = await verifyBoardCreation(client, 'empty-board');
    expect(result).toEqual({ accessible: true, count: 0 });
  });

  it('counts all element types, not just boards', async () => {
    const client = makeClient({
      board1: boardEl('Root'),
      col1: { elementType: 'COLUMN' },
      card1: { elementType: 'CARD' },
      link1: { elementType: 'LINK' },
      task1: { elementType: 'TASK_LIST' },
    });
    const result = await verifyBoardCreation(client, 'board1');
    expect(result.count).toBe(5);
  });
});
