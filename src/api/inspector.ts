/**
 * @file inspector.ts
 * @description Pre-flight workspace inspection — finds duplicate boards, snapshots state
 * @version 1.0.0
 * @created 2026-05-03T00:20:00Z
 * @lastUpdated 2026-05-03T00:20:00Z
 *
 * Runs before any ELEMENT_CREATE to prevent duplicate boards and preserve
 * the user's workspace state via a snapshot.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import type { MilanoteClient } from './client.js';

interface BoardSummary {
  id: string;
  title: string;
  createdTime?: number;
  url: string;
}

interface WorkspaceSnapshot {
  capturedAt: string;
  workspaceBoardId: string;
  boards: BoardSummary[];
  totalElements: number;
}

interface ElementResponse {
  elements?: Record<string, {
    elementType?: string;
    content?: { title?: string };
    meta?: { createdTime?: number };
    location?: { parentId?: string };
  }>;
}

/** Fetch all child boards of a workspace board */
async function fetchWorkspaceBoards(
  client: MilanoteClient,
  workspaceBoardId: string,
): Promise<{ snapshot: WorkspaceSnapshot; raw: ElementResponse }> {
  const raw = await client.getJson<ElementResponse>(
    `/api/elements?ids=${workspaceBoardId}&includeChildren=true`,
  );

  const boards: BoardSummary[] = Object.entries(raw.elements ?? {})
    .filter(([id, el]) => el.elementType === 'BOARD' && id !== workspaceBoardId)
    .map(([id, el]) => ({
      id,
      title: el.content?.title ?? '(no title)',
      createdTime: el.meta?.createdTime,
      url: `https://app.milanote.com/${id}/`,
    }))
    .sort((a, b) => (a.createdTime ?? 0) - (b.createdTime ?? 0));

  const snapshot: WorkspaceSnapshot = {
    capturedAt: new Date().toISOString(),
    workspaceBoardId,
    boards,
    totalElements: Object.keys(raw.elements ?? {}).length,
  };

  return { snapshot, raw };
}

/**
 * Save a workspace snapshot to .ms-debug/ for recovery reference.
 * Never throws — snapshot failure must not block the create operation.
 */
export async function saveWorkspaceSnapshot(
  client: MilanoteClient,
  workspaceBoardId: string,
): Promise<void> {
  try {
    await mkdir('.ms-debug', { recursive: true });
    const { snapshot } = await fetchWorkspaceBoards(client, workspaceBoardId);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filePath = path.join('.ms-debug', `workspace-snapshot-${ts}.json`);
    await writeFile(filePath, JSON.stringify(snapshot, null, 2));
    console.log(chalk.dim(`  Snapshot: ${filePath} (${snapshot.boards.length} boards)`));
  } catch {
    /* snapshot failure is advisory — never block the run */
  }
}

/**
 * Pre-flight check: abort if a board with the same title already exists
 * on the workspace canvas, unless --force is passed.
 *
 * @throws Error if duplicate found and force=false
 */
export async function assertNoDuplicate(
  client: MilanoteClient,
  workspaceBoardId: string,
  boardTitle: string,
  force: boolean,
): Promise<void> {
  let boards: BoardSummary[] = [];
  try {
    const { snapshot } = await fetchWorkspaceBoards(client, workspaceBoardId);
    boards = snapshot.boards;
  } catch {
    // If the inspection call fails (e.g. workspace returns empty), be advisory only
    console.log(chalk.dim('  Pre-flight inspection: could not fetch workspace state (continuing)'));
    return;
  }

  const duplicates = boards.filter(
    (b) => b.title.toLowerCase() === boardTitle.toLowerCase(),
  );

  if (duplicates.length === 0) return;

  const list = duplicates
    .map((d) => `    ${chalk.cyan(d.url)}  "${d.title}"`)
    .join('\n');

  if (force) {
    console.log(
      chalk.yellow(`\n  ⚠ --force: ${duplicates.length} board(s) with title "${boardTitle}" already exist:\n${list}`),
    );
    return;
  }

  throw new Error(
    `Board "${boardTitle}" already exists on the workspace canvas:\n${list}\n\n` +
    `Use --force to create anyway, or --folder <name> to isolate test runs in a folder.`,
  );
}
