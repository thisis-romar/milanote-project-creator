/**
 * @file page.ts
 * @description Find or open the Milanote tab in the connected browser
 * @version 1.0.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

import type { Browser, Page } from 'playwright';

export const MILANOTE_HOST = 'app.milanote.com';

export async function getOrOpenMilanotePage(browser: Browser): Promise<Page> {
  for (const ctx of browser.contexts()) {
    for (const pg of ctx.pages()) {
      if (pg.url().includes(MILANOTE_HOST)) {
        return pg;
      }
    }
  }
  const ctx = browser.contexts()[0] ?? (await browser.newContext());
  const page = await ctx.newPage();
  return page;
}
