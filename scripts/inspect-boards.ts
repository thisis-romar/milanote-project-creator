import { chromium } from 'playwright';
import { getMilanoteCookies, MilanoteClient } from '../src/api/client.js';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const ctx = browser.contexts()[0];
const cookies = await getMilanoteCookies(ctx);
const client = new MilanoteClient(cookies);
await browser.close();

const ids: Record<string, string> = {
  'home':       '1Wd9Kk1YamXgYd',
  'IvsEEJkd':   'IvsEEJkd8ZJmRX',
  'v1-new':     'XYx4R7DkNNLKBt',
  'v2-current': 'wleCaJZxMTHHMV',
  'old-board':  'rxfkC4C9MFSZks',
};

interface ElResponse {
  elements?: Record<string, {
    elementType?: string;
    content?: { title?: string };
    location?: { parentId?: string };
    meta?: { createdTime?: number };
  }>;
}

for (const [label, id] of Object.entries(ids)) {
  try {
    const data = await client.getJson<ElResponse>(`/api/elements?ids=${id}&includeChildren=true`);
    const elems = data.elements ?? {};
    const count = Object.keys(elems).length;
    const types: Record<string, number> = {};
    for (const el of Object.values(elems)) {
      const t = el.elementType ?? '?';
      types[t] = (types[t] ?? 0) + 1;
    }
    console.log(`\n[${label}] ${id}: ${count} elements`);
    console.log(`  types: ${JSON.stringify(types)}`);
    for (const [eid, el] of Object.entries(elems).slice(0, 6)) {
      const created = el.meta?.createdTime ? new Date(el.meta.createdTime).toISOString().slice(11,19) : '';
      console.log(`  ${eid}  ${el.elementType}  "${el.content?.title ?? ''}"  parent=${el.location?.parentId ?? ''}  ${created}`);
    }
    if (Object.keys(elems).length > 6) console.log(`  ... (+${Object.keys(elems).length - 6} more)`);
  } catch (e) {
    console.log(`\n[${label}] ${id}: ERROR — ${(e as Error).message}`);
  }
}
