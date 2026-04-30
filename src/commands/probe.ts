/**
 * @file probe.ts
 * @description `milanote-creator probe` command — passive XHR capture for endpoint discovery
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { attachToEdge } from '../cdp/attach.js';
import { getOrOpenMilanotePage, MILANOTE_HOST } from '../cdp/page.js';
import { captureNetwork, summarize } from '../api/probe.js';

interface ProbeOptions {
  duration: string;
  out?: string;
  url: string;
}

export function registerProbeCommand(program: Command): void {
  program
    .command('probe')
    .description('Capture XHR/fetch traffic from your Milanote session for endpoint discovery')
    .option('-d, --duration <seconds>', 'how long to capture', '120')
    .option('-o, --out <file>', 'output file (default: .ms-debug/probe-<ts>.json)')
    .option('-u, --url <url>', 'URL to load if no Milanote tab is open', 'https://app.milanote.com')
    .action(async (opts: ProbeOptions) => {
      const seconds = Number(opts.duration);
      if (!Number.isFinite(seconds) || seconds <= 0) {
        throw new Error(`Invalid --duration: ${opts.duration}`);
      }

      console.log(chalk.cyan('Attaching to Edge via CDP...'));
      const browser = await attachToEdge(opts.url);
      const page = await getOrOpenMilanotePage(browser);
      if (!page.url().includes(MILANOTE_HOST)) {
        await page.goto(opts.url, { waitUntil: 'load', timeout: 60_000 });
      }

      console.log(chalk.yellow(`\n→ Perform Milanote actions in your Edge window now (create boards, add cards, etc.)`));
      console.log(chalk.yellow(`→ Capturing for ${seconds}s...\n`));

      let count = 0;
      const spinner = ora(`Captured 0 requests`).start();
      const result = await captureNetwork(page, {
        durationMs: seconds * 1000,
        onRequest: (r) => {
          count += 1;
          spinner.text = `Captured ${count} requests — last: ${r.method} ${r.pathname}`;
        },
      });
      spinner.succeed(`Captured ${result.totalRequests} requests`);

      const outDir = '.ms-debug';
      await mkdir(outDir, { recursive: true });
      const outFile = opts.out ?? path.join(outDir, `probe-${Date.now()}.json`);
      await writeFile(outFile, JSON.stringify(result, null, 2));
      console.log(chalk.green('Saved:'), outFile);

      const summary = summarize(result);
      console.log('\n' + chalk.bold('By method:'));
      for (const [method, n] of Object.entries(summary.byMethod)) {
        console.log(`  ${method.padEnd(8)} ${n}`);
      }
      console.log('\n' + chalk.bold('By status:'));
      for (const [status, n] of Object.entries(summary.byStatus)) {
        console.log(`  ${status.padEnd(8)} ${n}`);
      }
      console.log('\n' + chalk.bold('Top paths:'));
      for (const { path: p, count: n, methods } of summary.topPaths.slice(0, 15)) {
        console.log(`  ${String(n).padStart(3)}× [${methods.join(',')}] ${p}`);
      }

      if (summary.candidateMutations.length > 0) {
        console.log('\n' + chalk.bold.green(`Candidate mutations (${summary.candidateMutations.length}):`));
        const seen = new Set<string>();
        for (const r of summary.candidateMutations) {
          const key = `${r.method} ${r.pathname}`;
          if (seen.has(key)) continue;
          seen.add(key);
          console.log(`  ${chalk.green(r.method)} ${r.pathname}  (${r.responseStatus})`);
        }
      } else {
        console.log('\n' + chalk.dim('No 2xx mutations captured. Try performing more actions, or extend --duration.'));
      }

      await browser.close();
    });
}
