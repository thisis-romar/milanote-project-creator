/**
 * @file workspaces.ts
 * @description `milanote-creator workspaces` — list available Milanote workspaces
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 *
 * Needed because `create --workspace <id>` requires a valid workspace ID but
 * there was previously no way to discover them. Stubbed pending probe session —
 * once the workspace-list endpoint is identified, implement the body below.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { attachToEdge } from '../cdp/attach.js';
import { getOrOpenMilanotePage, MILANOTE_HOST } from '../cdp/page.js';
import { getMilanoteCookies, MilanoteClient } from '../api/client.js';
import { NotImplementedError } from '../creator/types.js';

const PROBE_HINT =
  'Run `npm run dev probe -- --duration 60`, navigate to a Milanote workspace in Edge during ' +
  'the capture window, then look for a GET /api/workspaces or GET /api/teams endpoint in ' +
  '.ms-debug/probe-*.json. Implement listWorkspaces() in this file once the endpoint is known.';

async function listWorkspaces(_client: MilanoteClient): Promise<Array<{ id: string; name: string }>> {
  void _client;
  throw new NotImplementedError('listWorkspaces', PROBE_HINT);
}

interface WorkspacesOptions {
  url: string;
  json: boolean;
}

export function registerWorkspacesCommand(program: Command): void {
  program
    .command('workspaces')
    .description('List available Milanote workspaces (use the ID with --workspace on create)')
    .option('-u, --url <url>', 'URL to load if no Milanote tab is open', 'https://app.milanote.com')
    .option('--json', 'output as JSON instead of a table')
    .action(async (opts: WorkspacesOptions) => {
      console.log(chalk.cyan('Attaching to Edge via CDP...'));
      const browser = await attachToEdge(opts.url);
      const page = await getOrOpenMilanotePage(browser);
      if (!page.url().includes(MILANOTE_HOST)) {
        await page.goto(opts.url, { waitUntil: 'load', timeout: 60_000 });
      }

      const cookies = await getMilanoteCookies(page.context());
      const client = new MilanoteClient(cookies);

      try {
        const workspaces = await listWorkspaces(client);
        if (opts.json) {
          console.log(JSON.stringify(workspaces, null, 2));
        } else {
          console.log(chalk.bold('\nWorkspaces:'));
          for (const ws of workspaces) {
            console.log(`  ${chalk.cyan(ws.id)}  ${ws.name}`);
          }
          console.log(chalk.dim('\nUse the ID with: milanote-creator create <template> --workspace <id>'));
        }
      } catch (e) {
        if (e instanceof NotImplementedError) {
          console.error(chalk.red(`✗ ${e.message}`));
          console.error(chalk.dim('\nNext step: run the probe command while navigating workspaces:'));
          console.error(chalk.dim('  npm run dev probe -- --duration 60'));
          process.exitCode = 1;
        } else {
          throw e;
        }
      } finally {
        await browser.close();
      }
    });
}
