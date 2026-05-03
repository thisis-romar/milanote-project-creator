/**
 * @file attach.ts
 * @description Attach to the user's live Edge instance via CDP and return a Playwright Browser
 * @version 1.0.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import { chromium, type Browser } from 'playwright';
import { CDP_PORT, launchEdgeWithCDP, waitForCDP } from './edge.js';

export async function attachToEdge(initialUrl = 'about:blank'): Promise<Browser> {
  await launchEdgeWithCDP(initialUrl);
  await waitForCDP();
  // Use a longer timeout — many open tabs slow the CDP protocol handshake
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`, { timeout: 120_000 });
  return browser;
}
