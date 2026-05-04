/**
 * @file delete.test.ts
 * @description Tests for fetchElementMeta — REST lookup for element parent/type/title
 * @version 0.1.0
 * @created 2026-05-04T00:00:00Z
 * @lastUpdated 2026-05-04T00:00:00Z
 */

import { describe, it, expect, vi } from 'vitest';
import { fetchElementMeta } from './delete.js';
import type { MilanoteClient } from '../api/client.js';

function makeClient(elements: Record<string, unknown> = {}): MilanoteClient {
  return {
    getJson: vi.fn().mockResolvedValue({ elements }),
  } as unknown as MilanoteClient;
}

describe('fetchElementMeta', () => {
  it('extracts parentId, elementType, and title from an element', async () => {
    const client = makeClient({
      'elem1': { elementType: 'BOARD', location: { parentId: 'parent99' }, content: { title: 'My Board' } },
    });
    const result = await fetchElementMeta(client, 'elem1');
    expect(result).toEqual({ parentId: 'parent99', elementType: 'BOARD', title: 'My Board' });
  });

  it('defaults elementType to BOARD and title to empty string when fields are absent', async () => {
    const client = makeClient({ 'elem1': { location: { parentId: 'p1' } } });
    const result = await fetchElementMeta(client, 'elem1');
    expect(result?.parentId).toBe('p1');
    expect(result?.elementType).toBe('BOARD');
    expect(result?.title).toBe('(no title)');
  });

  it('returns null when the element is not found in the response', async () => {
    const client = makeClient({});
    expect(await fetchElementMeta(client, 'missing')).toBeNull();
  });

  it('returns null when getJson throws', async () => {
    const client = { getJson: vi.fn().mockRejectedValue(new Error('network')) } as unknown as MilanoteClient;
    expect(await fetchElementMeta(client, 'elem1')).toBeNull();
  });

  it('passes the correct API path to getJson', async () => {
    const client = makeClient({ 'abc': { location: { parentId: 'p' }, content: { title: 't' } } });
    await fetchElementMeta(client, 'abc');
    expect(client.getJson).toHaveBeenCalledWith('/api/elements?ids=abc');
  });
});
