/**
 * @file workspaces.ts
 * @description `milanote-creator workspaces` — show current workspace board ID and list child boards
 * @version 0.2.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-05-02T20:30:00Z
 *
 * Connects to the live Edge session, reads the current Milanote page URL to identify
 * the workspace board ID, then fetches all child boards. Useful for discovering the
 * ID to pass to `create --workspace <id>`.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { attachToEdge } from '../cdp/attach.js';
import { getOrOpenMilanotePage, MILANOTE_HOST } from '../cdp/page.js';
import { getMilanoteCookies, MilanoteClient } from '../api/client.js';

interface WorkspacesOptions {
  url: string;
  json: boolean;
}

interface ElementResponse {
  elements?: Record<string, {
    elementType?: string;
    content?: { title?: string };
    meta?: { createdTime?: number };
  }>;
}

export function registerWorkspacesCommand(program: Command): void {
  program
    .command('workspaces')
    .description('Show the current workspace board ID and list boards within it')
    .option('-u, --url <url>', 'URL to load if no Milanote tab is open', 'https://app.milanote.com')
    .option('--json', 'output as JSON instead of a table')
    .action(async (opts: WorkspacesOptions) => {
      console.log(chalk.cyan('Attaching to Edge via CDP...'));
      const browser = await attachToEdge(opts.url);
      const page = await getOrOpenMilanotePage(browser);
      if (!page.url().includes(MILANOTE_HOST)) {
        await page.goto(opts.url, { waitUntil: 'load', timeout: 60_000 });
      }

      try {
        const cookies = await getMilanoteCookies(page.context());
        const client = new MilanoteClient(cookies);

        const pageUrl = page.url();
        const m = pageUrl.match(/app\.milanote\.com\/([A-Za-z0-9]+)/);
        const workspaceId = m?.[1];

        if (!workspaceId) {
          console.error(chalk.red('✗ Could not extract workspace board ID from the current page URL.'));
          console.error(chalk.dim(`  Page URL: ${pageUrl}`));
          console.error(chalk.dim('  Make sure Milanote is open on a board page.'));
          process.exitCode = 1;
          return;
        }

        console.log(chalk.dim(`\nCurrent workspace board: ${workspaceId}`));

        const raw = await client.getJson<ElementResponse>(
          `/api/elements?ids=${workspaceId}&includeChildren=true`,
        );

        const boards = Object.entries(raw.elements ?? {})
          .filter(([id, el]) => el.elementType === 'BOARD' && id !== workspaceId)
          .map(([id, el]) => ({
            id,
            title: el.content?.title ?? '(no title)',
            createdTime: el.meta?.createdTime,
            url: `https://app.milanote.com/${id}/`,
          }))
          .sort((a, b) => (a.createdTime ?? 0) - (b.createdTime ?? 0));

        if (opts.json) {
          console.log(JSON.stringify({ workspaceId, boards }, null, 2));
        } else {
          console.log(chalk.bold(`\nBoards in workspace ${chalk.cyan(workspaceId)} (${boards.length} total):\n`));
          for (const b of boards) {
            console.log(`  ${chalk.cyan(b.id)}  ${b.title}`);
            console.log(chalk.dim(`             ${b.url}`));
          }
          console.log(chalk.dim(`\nPass the workspace ID to create:`));
          console.log(chalk.dim(`  milanote-creator create <template> --workspace ${workspaceId}`));
        }
      } finally {
        await browser.close();
      }
    });
}
