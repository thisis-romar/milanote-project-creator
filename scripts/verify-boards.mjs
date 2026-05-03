/**
 * Verify that conversation link cards exist in the Nomad AV Rack boards.
 * Run: node scripts/verify-boards.mjs
 */
import { chromium } from 'playwright';

const BOARDS_TO_CHECK = {
  'v1 — Nomad Toronto AV Rack':    'XYx4R7DkNNLKBt',
  'v2 — Nomad Toronto AV Rack v2': 'wleCaJZxMTHHMV',
};

const EXPECTED_CONVERSATIONS = [
  { id: '81ef8190', url: 'https://claude.ai/chat/81ef8190-238f-4f37-901d-ead397b7a6e1', label: 'Amp Rack Cable Schedule' },
  { id: '61c49787', url: 'https://claude.ai/chat/61c49787-7fd9-4227-ae32-2f3c8301d7f6', label: 'Audio Rack Equipment Audit' },
  { id: 'c8999358', url: 'https://claude.ai/chat/c8999358-0d6d-42d2-8abd-d5e1b06ff2d8', label: 'CQ12 Mixer Diagram' },
  { id: 'bfe45378', url: 'https://claude.ai/chat/bfe45378-1df0-4646-b3a1-dde53b1db8c4', label: 'Yamaha MG12 Corrections' },
  { id: 'fb56aa22', url: 'https://claude.ai/chat/fb56aa22-37a8-4633-825c-6dd1c91f4db5', label: '19-Inch Rack Architecture' },
  { id: '77927477', url: 'https://claude.ai/chat/77927477-ddf9-4a6e-8507-652816224db0', label: 'SVG Rack Elevation Skill' },
  { id: '5b4811a9', url: 'https://claude.ai/chat/5b4811a9-d684-4dd6-a647-6784a4ce8865', label: 'Business & Monetization' },
];

const browser = await chromium.connectOverCDP('http://localhost:9222');
const ctx = browser.contexts()[0];
const cookies = (await ctx.cookies()).filter(c => c.domain.includes('milanote.com'));
const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
await browser.close();

async function apiFetch(path) {
  const resp = await fetch(`https://app.milanote.com${path}`, {
    headers: { cookie: cookieHeader, accept: 'application/json' },
  });
  if (!resp.ok) return null;
  return resp.json();
}

// First, inspect the home board to see what's actually there
console.log('=== HOME BOARD (1Wd9Kk1YamXgYd) ===');
const home = await apiFetch('/api/elements?ids=1Wd9Kk1YamXgYd&includeChildren=true');
const homeElems = home?.elements ?? {};
console.log(`Total elements returned: ${Object.keys(homeElems).length}`);
for (const [id, el] of Object.entries(homeElems)) {
  if (id === '1Wd9Kk1YamXgYd') continue;
  console.log(`  ${id}  ${el.elementType}  "${el.content?.title ?? ''}"  parent=${el.location?.parentId}`);
}

// Check each target board
for (const [label, rootId] of Object.entries(BOARDS_TO_CHECK)) {
  console.log(`\n${'═'.repeat(62)}`);
  console.log(`${label}  [${rootId}]`);
  console.log('═'.repeat(62));

  const rootData = await apiFetch(`/api/elements?ids=${rootId}&includeChildren=true`);
  if (!rootData) { console.log('  ✗ Could not fetch board'); continue; }

  const elems = rootData.elements ?? {};
  console.log(`  API returned ${Object.keys(elems).length} elements`);

  // Print all element types
  const byType = {};
  for (const [id, el] of Object.entries(elems)) {
    const t = el.elementType ?? 'unknown';
    byType[t] = (byType[t] ?? 0) + 1;
  }
  console.log(`  Types: ${JSON.stringify(byType)}`);

  // Find subboards and fetch their children
  const subBoards = Object.entries(elems)
    .filter(([id, el]) => el.elementType === 'BOARD' && id !== rootId)
    .map(([id, el]) => ({ id, title: el.content?.title ?? '(no title)' }));

  const allFoundLinks = [];

  for (const sub of subBoards) {
    const subData = await apiFetch(`/api/elements?ids=${sub.id}&includeChildren=true`);
    const subElems = subData?.elements ?? {};
    const links = Object.entries(subElems)
      .filter(([, el]) => el.elementType === 'LINK')
      .map(([id, el]) => ({
        id,
        url: el.content?.url ?? el.content?.originalUrl ?? '(no url)',
        title: el.content?.title ?? '(no title)',
        subboard: sub.title,
      }));
    allFoundLinks.push(...links);
    console.log(`\n  Subboard: "${sub.title}" — ${links.length} link(s)`);
    for (const lk of links) {
      const match = EXPECTED_CONVERSATIONS.find(e => lk.url.includes(e.id));
      const ok = match ? '✓' : '?';
      console.log(`    ${ok} ${lk.title.slice(0, 52)}`);
      console.log(`       ${lk.url}`);
    }
  }

  // Summary
  const foundIds = new Set(allFoundLinks.map(l => {
    const m = l.url.match(/chat\/([a-f0-9-]+)/);
    return m ? m[1].slice(0, 8) : null;
  }).filter(Boolean));

  const missing = EXPECTED_CONVERSATIONS.filter(e => !foundIds.has(e.id));
  console.log(`\n  ─── Result ──────────────────────────────`);
  console.log(`  ${allFoundLinks.length} link cards found across ${subBoards.length} subboards`);
  if (missing.length === 0) {
    console.log('  ✓ All 7 conversation links present');
  } else {
    console.log(`  ${missing.length} conversation(s) missing:`);
    for (const m of missing) console.log(`    ✗ [${m.id}] ${m.label}`);
  }
}
