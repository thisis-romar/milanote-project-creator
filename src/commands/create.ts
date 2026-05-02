/**
 * @file create.ts
 * @description `milanote-creator create <template.json>` — the headline command
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { parseTemplate, TemplateParseError } from '../template/parser.js';
import { buildPlan, printPlan, summarize } from '../creator/plan.js';
import { createFromTemplate, OrchestratorError } from '../creator/orchestrator.js';
import { ApiCreator } from '../api/creator.js';
import { CollabSocket } from '../api/collab-socket.js';
import { UiCreator } from '../ui/driver.js';
import { MilanoteClient, getMilanoteCookies } from '../api/client.js';
import { attachToEdge } from '../cdp/attach.js';
import { getOrOpenMilanotePage, MILANOTE_HOST } from '../cdp/page.js';
import { NotImplementedError } from '../creator/types.js';

interface CreateOptions {
  var?: string[];
  workspace?: string;
  dryRun?: boolean;
  url: string;
}

function parseVarFlags(values: string[] | undefined): Record<string, string> {
  if (!values) return {};
  const out: Record<string, string> = {};
  for (const v of values) {
    const eq = v.indexOf('=');
    if (eq < 0) throw new Error(`Invalid --var (expected key=value): ${v}`);
    out[v.slice(0, eq)] = v.slice(eq + 1);
  }
  return out;
}

export function registerCreateCommand(program: Command): void {
  program
    .command('create <template>')
    .description('Create a Milanote board from a JSON template')
    .option('--var <key=value...>', 'override a template variable', (val: string, prev: string[] = []) => [...prev, val])
    .option('-w, --workspace <id>', 'target workspace ID (default: current)')
    .option('--dry-run', 'parse, validate, and print the plan without creating anything')
    .option('-u, --url <url>', 'URL to load if no Milanote tab is open', 'https://app.milanote.com')
    .action(async (template: string, opts: CreateOptions) => {
      const overrides = parseVarFlags(opts.var);

      // Parse + validate
      let parsed;
      try {
        parsed = await parseTemplate(template, { overrides });
      } catch (e) {
        if (e instanceof TemplateParseError) {
          console.error(chalk.red(`✗ ${e.message}`));
          for (const issue of e.issues) console.error(`  ${issue}`);
          process.exitCode = 1;
          return;
        }
        throw e;
      }

      // Print plan
      const plan = buildPlan(parsed);
      console.log(chalk.bold(`\nPlan for ${template}:`));
      printPlan(plan);
      console.log(chalk.dim(`\nTotals: ${summarize(plan)}`));

      if (opts.dryRun) {
        console.log(chalk.yellow('\n--dry-run — nothing created.'));
        return;
      }

      // Live mode: attach, build creators, run orchestrator
      console.log(chalk.cyan('\nAttaching to Edge via CDP...'));
      const browser = await attachToEdge(opts.url);
      const page = await getOrOpenMilanotePage(browser);
      if (!page.url().includes(MILANOTE_HOST)) {
        await page.goto(opts.url, { waitUntil: 'load', timeout: 60_000 });
      }

      const cookies = await getMilanoteCookies(page.context());
      const client = new MilanoteClient(cookies);

      // Extract the workspace/home board ID from the current page URL or --workspace flag.
      // URL pattern: https://app.milanote.com/<boardId>/home  or  /<boardId>/<name>
      const workspaceBoardId =
        opts.workspace ??
        (() => {
          const m = page.url().match(/app\.milanote\.com\/([A-Za-z0-9]+)/);
          return m?.[1];
        })();

      if (workspaceBoardId) {
        console.log(chalk.dim(`  Workspace board: ${workspaceBoardId}`));
      } else {
        console.log(chalk.yellow('  Warning: could not extract workspace board ID from URL. createRootBoard will fail.'));
      }

      const socket = new CollabSocket();
      await socket.connect(page);
      const apiCreator = new ApiCreator(client, workspaceBoardId, socket);
      const uiCreator = new UiCreator(page);

      try {
        const root = await createFromTemplate(parsed, {
          primary: apiCreator,
          fallback: uiCreator,
          verbose: true,
        });
        console.log(chalk.green('\n✓ Board created'));
        if (root.url) console.log(`  URL: ${root.url}`);
      } catch (e) {
        if (e instanceof OrchestratorError && e.cause instanceof NotImplementedError) {
          console.error(chalk.red(`\n✗ ${e.message}`));
          console.error(chalk.dim('A creator method is still unimplemented. Check the error above for details.'));
          process.exitCode = 1;
        } else {
          throw e;
        }
      } finally {
        await socket.disconnect();
        await browser.close();
      }
    });
}
