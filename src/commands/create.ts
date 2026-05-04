/**
 * @file create.ts
 * @description `milanote-creator create <template.json>` — the headline command
 * @version 0.3.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-05-02T20:30:00Z
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseTemplate, TemplateParseError } from '../template/parser.js';
import { buildPlan, printPlan, summarize } from '../creator/plan.js';
import { createFromTemplate, OrchestratorError } from '../creator/orchestrator.js';
import { ApiCreator } from '../api/creator.js';
import { CollabSocket, generateElementId } from '../api/collab-socket.js';
import { UiCreator } from '../ui/driver.js';
import { MilanoteClient, getMilanoteCookies } from '../api/client.js';
import { attachToEdge, getCookiesViaCDP } from '../cdp/attach.js';
import { getOrOpenMilanotePage, MILANOTE_HOST } from '../cdp/page.js';
import { buildCookieHeader } from '../api/client.js';
import { NotImplementedError } from '../creator/types.js';
import { assertNoDuplicate, saveWorkspaceSnapshot, verifyBoardCreation } from '../api/inspector.js';
import { parseVarFlags } from './utils.js';

interface CreateOptions {
  var?: string[];
  workspace?: string;
  dryRun?: boolean;
  force?: boolean;
  folder?: string;
  url: string;
}

/**
 * Acquire a per-workspace run lock file. Returns true if acquired.
 * Treats locks older than 5 minutes as stale and reclaims them.
 */
export async function tryAcquireLock(lockPath: string): Promise<boolean> {
  await mkdir('.ms-debug', { recursive: true });
  try {
    const s = await stat(lockPath);
    if (Date.now() - s.mtimeMs < 5 * 60 * 1000) return false; // held by an active run
  } catch { /* absent — create it */ }
  await writeFile(lockPath, String(process.pid));
  return true;
}

export function registerCreateCommand(program: Command): void {
  program
    .command('create <template>')
    .description('Create a Milanote board from a JSON template')
    .option('--var <key=value...>', 'override a template variable', (val: string, prev: string[] = []) => [...prev, val])
    .option('-w, --workspace <id>', 'target workspace ID (default: current)')
    .option('--dry-run', 'parse, validate, and print the plan without creating anything')
    .option('--force', 'skip duplicate-title check and create anyway')
    .option('--folder <name>', 'wrap content inside an isolation folder board (skips duplicate check)')
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
      // Primary path: raw CDP cookie extraction (fast, works regardless of tab count).
      // Playwright is attempted afterwards for UiCreator support — failure is non-fatal
      // since ApiCreator handles all supported card types without Playwright.
      console.log(chalk.cyan('\nAttaching to Edge via CDP...'));

      const { cookies: cdpCookies, userId: cdpUserId } = await getCookiesViaCDP();

      let browser = null;
      let page = null;
      try {
        browser = await attachToEdge(opts.url);
        page = await getOrOpenMilanotePage(browser);
        if (!page.url().includes(MILANOTE_HOST)) {
          await page.goto(opts.url, { waitUntil: 'load', timeout: 60_000 });
        }
      } catch {
        // Playwright unavailable (too many tabs / context closed) — ApiCreator path only
        console.log(chalk.dim('  Playwright unavailable — using ApiCreator (no UI fallback)'));
      }

      const cookies = page ? await getMilanoteCookies(page.context()) : cdpCookies;
      const client = new MilanoteClient(cookies);

      // Extract the workspace/home board ID from --workspace flag or current page URL.
      const workspaceBoardId =
        opts.workspace ??
        (page
          ? (() => { const m = page.url().match(/app\.milanote\.com\/([A-Za-z0-9]+)/); return m?.[1]; })()
          : undefined);

      if (workspaceBoardId) {
        console.log(chalk.dim(`  Workspace board: ${workspaceBoardId}`));
      } else {
        console.log(chalk.yellow('  Warning: could not extract workspace board ID from URL. createRootBoard will fail.'));
      }

      // Concurrent-run lock — one create per workspace at a time
      const lockPath = workspaceBoardId
        ? path.join('.ms-debug', `.lock-${workspaceBoardId}`)
        : null;
      let lockAcquired = false;
      if (lockPath) {
        lockAcquired = await tryAcquireLock(lockPath);
        if (!lockAcquired) {
          console.error(chalk.red(`\n✗ Another create is already running against workspace ${workspaceBoardId}.`));
          console.error(chalk.dim(`  If this is stale (> 5 min old), delete: ${lockPath}`));
          await browser?.close();
          process.exitCode = 1;
          return;
        }
      }

      const socket = new CollabSocket();

      const releaseLock = async () => {
        if (lockPath && lockAcquired) await unlink(lockPath).catch(() => {});
      };
      // Ensure the lock is released on Ctrl-C as well
      process.once('SIGINT', async () => {
        await socket.disconnect().catch(() => {});
        await browser?.close().catch(() => {});
        await releaseLock();
        process.exit(130);
      });

      try {
        // Pre-flight: snapshot the workspace (always), then guard against duplicates
        if (workspaceBoardId) {
          await saveWorkspaceSnapshot(client, workspaceBoardId);
          if (!opts.folder) {
            // --folder skips the duplicate check — isolation is the whole point
            await assertNoDuplicate(client, workspaceBoardId, parsed.board.title, opts.force ?? false);
          }
        }

        // Connect socket — use raw credentials if Playwright wasn't available
        if (page) {
          await socket.connect(page);
        } else {
          await socket.connectRaw(buildCookieHeader(cookies), cdpUserId);
        }

        // If --folder: create a wrapper board and route all content inside it
        let effectiveWorkspaceBoardId = workspaceBoardId;
        if (opts.folder && workspaceBoardId) {
          console.log(chalk.cyan(`\nCreating isolation folder: "${opts.folder}"...`));
          const folderId = generateElementId();
          await socket.navigate(workspaceBoardId);
          await socket.createElement(workspaceBoardId, folderId, 'BOARD', { title: opts.folder });
          await new Promise((r) => setTimeout(r, 800));
          effectiveWorkspaceBoardId = folderId;
          console.log(chalk.dim(`  Folder board: ${folderId}`));
        }

        const apiCreator = new ApiCreator(client, effectiveWorkspaceBoardId, socket);
        // UiCreator requires a Playwright page; omit fallback when raw CDP path is used
        const uiCreator = page ? new UiCreator(page) : undefined;

        const root = await createFromTemplate(parsed, {
          primary: apiCreator,
          fallback: uiCreator,
          verbose: true,
        });
        console.log(chalk.green('\n✓ Board created'));
        if (root.url) console.log(`  URL: ${root.url}`);

        // Post-create verification — confirm the board is readable and has children
        const v = await verifyBoardCreation(client, root.id);
        if (!v.accessible) {
          console.log(chalk.yellow('  Warning: could not fetch board back to verify (it may still have been created)'));
        } else {
          console.log(chalk.dim(`  Verified: ${v.count} element(s) visible in root board`));
        }
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
        await browser?.close();
        await releaseLock();
      }
    });
}
