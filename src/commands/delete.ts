/**
 * @file delete.ts
 * @description `milanote-creator delete <boardId>` — delete a board by ID via Socket.IO
 * @version 0.1.0
 * @created 2026-05-02T20:30:00Z
 * @lastUpdated 2026-05-02T20:30:00Z
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { attachToEdge } from '../cdp/attach.js';
import { getOrOpenMilanotePage, MILANOTE_HOST } from '../cdp/page.js';
import { getMilanoteCookies, MilanoteClient } from '../api/client.js';
import { CollabSocket } from '../api/collab-socket.js';

interface DeleteOptions {
  url: string;
  type: string;
  parentId?: string;
}

interface ElementResponse {
  elements?: Record<string, {
    elementType?: string;
    location?: { parentId?: string };
    content?: { title?: string };
  }>;
}

/** Fetch the element to find its parentId and type. */
async function fetchElementMeta(
  client: MilanoteClient,
  elementId: string,
): Promise<{ parentId: string; elementType: string; title: string } | null> {
  try {
    const raw = await client.getJson<ElementResponse>(`/api/elements?ids=${elementId}`);
    const el = raw.elements?.[elementId];
    if (!el) return null;
    return {
      parentId: el.location?.parentId ?? '',
      elementType: el.elementType ?? 'BOARD',
      title: el.content?.title ?? '(no title)',
    };
  } catch {
    return null;
  }
}

export function registerDeleteCommand(program: Command): void {
  program
    .command('delete <boardId>')
    .description('Delete a Milanote board or element by ID')
    .option('--parent-id <id>', 'parent board ID (looked up automatically if omitted)')
    .option('--type <type>', 'element type', 'BOARD')
    .option('-u, --url <url>', 'URL to load if no Milanote tab is open', 'https://app.milanote.com')
    .action(async (boardId: string, opts: DeleteOptions) => {
      console.log(chalk.cyan('\nAttaching to Edge via CDP...'));
      const browser = await attachToEdge(opts.url);
      const page = await getOrOpenMilanotePage(browser);
      if (!page.url().includes(MILANOTE_HOST)) {
        await page.goto(opts.url, { waitUntil: 'load', timeout: 60_000 });
      }

      const cookies = await getMilanoteCookies(page.context());
      const client = new MilanoteClient(cookies);

      // Resolve parent board — either from --parent-id or by fetching the element
      let parentId = opts.parentId;
      let elementType = opts.type;
      let title = boardId;

      if (!parentId) {
        console.log(chalk.dim(`  Looking up parent for ${boardId}...`));
        const meta = await fetchElementMeta(client, boardId);
        if (!meta || !meta.parentId) {
          console.error(chalk.red(`✗ Could not find element ${boardId} or determine its parent.`));
          console.error(chalk.dim('  Use --parent-id <id> to specify the parent board directly.'));
          await browser.close();
          process.exitCode = 1;
          return;
        }
        parentId = meta.parentId;
        elementType = meta.elementType;
        title = meta.title;
        console.log(chalk.dim(`  Found: "${title}" (${elementType}) in parent ${parentId}`));
      }

      const socket = new CollabSocket();
      try {
        await socket.connect(page);
        console.log(chalk.cyan(`\nDeleting "${title}" (${boardId})...`));
        await socket.deleteElement(parentId, boardId, elementType);
        console.log(chalk.green(`✓ Deleted ${boardId}`));
      } finally {
        await socket.disconnect();
        await browser.close();
      }
    });
}
