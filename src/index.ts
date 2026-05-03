#!/usr/bin/env node
/**
 * @file index.ts
 * @description milanote-project-creator CLI entry point
 * @version 0.3.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import 'dotenv/config';
import { createRequire } from 'node:module';
import { Command } from 'commander';
import chalk from 'chalk';
import { registerProbeCommand } from './commands/probe.js';
import { registerValidateCommand } from './commands/validate.js';
import { registerCreateCommand } from './commands/create.js';
import { registerDeleteCommand } from './commands/delete.js';
import { registerWorkspacesCommand } from './commands/workspaces.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const program = new Command();

program
  .name('milanote-creator')
  .description('Create Milanote boards programmatically from JSON templates')
  .version(version);

registerProbeCommand(program);
registerValidateCommand(program);
registerCreateCommand(program);
registerDeleteCommand(program);
registerWorkspacesCommand(program);

program
  .command('attach')
  .description('Attach to live Edge via CDP and open Milanote (smoke test)')
  .option('--url <url>', 'URL to load if no Milanote tab is open', 'https://app.milanote.com')
  .action(async (opts: { url: string }) => {
    const { attachToEdge } = await import('./cdp/attach.js');
    const { getOrOpenMilanotePage, MILANOTE_HOST } = await import('./cdp/page.js');

    console.log(chalk.cyan('Attaching to Edge via CDP...'));
    const browser = await attachToEdge(opts.url);

    console.log(chalk.cyan('Locating Milanote tab...'));
    const page = await getOrOpenMilanotePage(browser);

    if (!page.url().includes(MILANOTE_HOST)) {
      console.log(chalk.cyan(`Navigating to ${opts.url}...`));
      await page.goto(opts.url, { waitUntil: 'load', timeout: 60_000 });
    }

    const title = await page.title();
    const url = page.url();
    console.log(chalk.green('\nConnected.'));
    console.log(`  Title: ${title}`);
    console.log(`  URL:   ${url}`);

    await browser.close();
  });

program.parseAsync().catch((err: unknown) => {
  console.error(chalk.red('Error:'), err instanceof Error ? err.message : err);
  process.exit(1);
});
