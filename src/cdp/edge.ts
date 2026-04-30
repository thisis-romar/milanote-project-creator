/**
 * @file edge.ts
 * @description Edge/CDP helpers — TypeScript port of scripts/lib/edge-cdp.mjs
 * @version 1.0.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import { existsSync } from 'node:fs';
import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

export const CDP_PORT = Number(process.env.CDP_PORT ?? 9222);
export const EDGE_USER_DATA =
  process.env.EDGE_USER_DATA ?? path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data');

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function getEdgePath(): string {
  const candidates = [
    path.join(process.env['ProgramFiles(x86)'] ?? '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.ProgramFiles ?? '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return 'msedge.exe';
}

interface HttpResp {
  status: number | undefined;
  data: string;
}

export function httpGet(url: string): Promise<HttpResp> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

export async function waitForCDP(maxWait = 30_000): Promise<unknown> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const resp = await httpGet(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (resp.status === 200) return JSON.parse(resp.data);
    } catch {
      /* not ready */
    }
    await delay(1000);
  }
  throw new Error(`CDP endpoint not ready after ${maxWait / 1000}s — check that no other process owns port ${CDP_PORT}`);
}

export async function launchEdgeWithCDP(initialUrl = 'about:blank'): Promise<void> {
  try {
    await waitForCDP(3000);
    console.log('  CDP already open on port ' + CDP_PORT);
    return;
  } catch {
    /* not running, launch it */
  }

  console.log('  Closing Edge...');
  try {
    execSync('taskkill.exe /F /IM msedge.exe', { stdio: 'pipe' });
  } catch {
    /* not running */
  }
  await delay(1500);

  console.log('  Launching Edge with remote debugging...');
  const proc = spawn(
    getEdgePath(),
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${EDGE_USER_DATA}`,
      '--no-first-run',
      '--no-default-browser-check',
      initialUrl,
    ],
    { detached: true, stdio: 'ignore' },
  );
  proc.unref();

  await waitForCDP(60_000);
  console.log('  Edge CDP ready.');
}
