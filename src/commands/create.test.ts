/**
 * @file create.test.ts
 * @description Tests for tryAcquireLock — workspace run-lock mechanism
 * @version 0.1.0
 * @created 2026-05-04T00:00:00Z
 * @lastUpdated 2026-05-04T00:00:00Z
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tryAcquireLock } from './create.js';

vi.mock('node:fs/promises');
import { stat, writeFile, mkdir } from 'node:fs/promises';
const mockStat = vi.mocked(stat);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);

beforeEach(() => {
  vi.clearAllMocks();
  mockMkdir.mockResolvedValue(undefined as never);
  mockWriteFile.mockResolvedValue(undefined as never);
});

describe('tryAcquireLock', () => {
  it('acquires the lock when no lock file exists (stat throws ENOENT)', async () => {
    mockStat.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const acquired = await tryAcquireLock('.ms-debug/.lock-abc');
    expect(acquired).toBe(true);
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });

  it('refuses the lock when file is less than 5 minutes old', async () => {
    mockStat.mockResolvedValue({ mtimeMs: Date.now() - 30_000 } as never); // 30s ago
    const acquired = await tryAcquireLock('.ms-debug/.lock-abc');
    expect(acquired).toBe(false);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('reclaims a stale lock older than 5 minutes', async () => {
    mockStat.mockResolvedValue({ mtimeMs: Date.now() - 6 * 60 * 1000 } as never); // 6 min ago
    const acquired = await tryAcquireLock('.ms-debug/.lock-abc');
    expect(acquired).toBe(true);
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });

  it('writes the process PID to the lock file', async () => {
    mockStat.mockRejectedValue(new Error('ENOENT'));
    await tryAcquireLock('.ms-debug/.lock-pid');
    expect(mockWriteFile).toHaveBeenCalledWith('.ms-debug/.lock-pid', String(process.pid));
  });
});
