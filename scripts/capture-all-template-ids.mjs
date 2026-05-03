/**
 * Automated capture of board IDs for all 206 Milanote templates.
 * Clicks through every category + every template, captures the GET /api/boards?ids=<boardId>
 * request triggered by each selection, and builds a slug→boardId map.
 *
 * Run: node scripts/capture-all-template-ids.mjs
 * Do NOT interact with Edge while this runs (~8 minutes).
 */
import WebSocket from 'ws';
import { writeFile, readFile, mkdir } from 'node:fs/promises';

const delay = ms => new Promise(r => setTimeout(r, ms));

function makeCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();
  const listeners = [];
  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    listeners.forEach(fn => fn(msg));
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = id++;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
    setTimeout(() => { pending.delete(i); rej(new Error(method)); }, 15_000);
  });
  return { send, on: fn => listeners.push(fn), ready: () => new Promise(r => ws.once('open', r)), close: () => ws.close() };
}

// ── Load template catalog ─────────────────────────────────────────────────
const catalog = JSON.parse(await readFile('knowledge/milanote/reference/templates/template-catalog.json', 'utf-8'));
const collections = catalog.collections;
console.log(`Catalog: ${collections.length} categories, ${collections.reduce((n, c) => n + c.templates.length, 0)} templates`);

// ── CDP setup ─────────────────────────────────────────────────────────────
const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const page = targets.find(t => t.type === 'page' && t.url?.includes('milanote.com'));
if (!page) { console.error('No Milanote page found'); process.exit(1); }
console.log(`Using: ${page.url}\n`);

const cdp = makeCdp(page.webSocketDebuggerUrl);
await cdp.ready();
await cdp.send('Network.enable');
await cdp.send('Page.enable');

// Board ID capture: record any GET /api/boards?ids=<id> that isn't the home board
const HOME_IDS = new Set(['1Wd9Kk1YamXgYd', '1Wd9Kk1YamXgYe']);
let recentBoardIds = [];

cdp.on(msg => {
  if (msg.method === 'Network.requestWillBeSent') {
    const url = msg.params?.request?.url ?? '';
    const m = url.match(/\/api\/boards\?(?:loadAncestors=\w+&)?(?:excludeSelf=\w+&)?(?:loadAncestors=\w+&)?ids=([A-Za-z0-9]+)/);
    if (m && !HOME_IDS.has(m[1])) {
      recentBoardIds.push(m[1]);
    }
  }
});

// ── Navigate to new-board page ────────────────────────────────────────────
console.log('Navigating to new-board page...');
await cdp.send('Page.navigate', { url: 'https://app.milanote.com/1WjBrd1056Hnap/new-board' });
await new Promise(r => {
  const t = setTimeout(r, 20_000);
  cdp.on(m => { if (m.method === 'Page.loadEventFired') { clearTimeout(t); setTimeout(r, 3_000); } });
});

// Dismiss cookie dialog
await cdp.send('Runtime.evaluate', {
  expression: `[...document.querySelectorAll("button")].find(b=>b.textContent?.includes("Allow All"))?.click()`,
  returnByValue: true,
});
await delay(800);

// ── Helper: click a button by partial text ────────────────────────────────
const click = async (text, selector = 'button, [role="button"]') => {
  const result = await cdp.send('Runtime.evaluate', {
    expression: `(function(){
      const el = [...document.querySelectorAll(${JSON.stringify(selector)})]
        .find(b => b.textContent?.trim().includes(${JSON.stringify(text)}));
      if(!el) return null;
      el.click();
      return el.textContent?.trim().slice(0,50);
    })()`,
    returnByValue: true,
  });
  return result.result?.result?.value ?? null;
};

// ── Helper: click a template button by exact display name ─────────────────
const clickTemplate = async (displayName) => {
  const result = await cdp.send('Runtime.evaluate', {
    expression: `(function(){
      // Match TemplateButton by display name (handle "Top pick" badge suffix)
      const btns = [...document.querySelectorAll('[class*="TemplateButton"]')];
      const btn = btns.find(b => {
        const text = b.textContent?.trim() ?? '';
        return text.startsWith(${JSON.stringify(displayName)});
      });
      if(!btn) return null;
      btn.click();
      return btn.textContent?.trim().slice(0,50);
    })()`,
    returnByValue: true,
  });
  return result.result?.result?.value ?? null;
};

// ── Helper: get board ID captured in the last N ms ────────────────────────
const getNewBoardId = async (waitMs = 900) => {
  recentBoardIds = [];
  await delay(waitMs);
  // Return the LAST (most recent) board ID captured — typically the template preview board
  return recentBoardIds[recentBoardIds.length - 1] ?? null;
};

// ── Result accumulator ────────────────────────────────────────────────────
const result = {};     // slug → boardId
const missing = [];    // slugs where we couldn't capture a board ID
let total = 0;

// ── Process featured templates first ─────────────────────────────────────
console.log('=== Featured templates ===');
const featured = [
  { slug: 'empty-board', display: 'Empty board' },
  { slug: 'moodboard', display: 'Moodboard' },
  { slug: 'project-plan', display: 'Project Plan' },
  { slug: 'storyboard-template', display: 'Storyboard' },
  { slug: 'creative-brief-template', display: 'Creative Brief' },
  { slug: 'weekly-plan-template', display: 'Weekly Plan' },
];
for (const { slug, display } of featured) {
  const clicked = await clickTemplate(display);
  const boardId = await getNewBoardId(1000);
  if (boardId) {
    result[slug] = boardId;
    console.log(`  ✓ ${display} → ${boardId}`);
  } else {
    missing.push(slug);
    console.log(`  ? ${display} → (no board ID captured) clicked=${clicked}`);
  }
  total++;
}

// ── Process "More templates" categories ───────────────────────────────────
// Open the "More templates..." view
await click('More templates');
await delay(1200);
console.log('\n=== Category templates ===');

for (const collection of collections) {
  const catName = collection.title;
  const templates = collection.templates;

  // Click the category button
  const catClicked = await click(catName, '[class*="CategoryButton"], [class*="TemplatePickerListingButton"]');
  if (!catClicked) {
    console.log(`  [${catName}] CATEGORY NOT FOUND — skipping ${templates.length} templates`);
    missing.push(...templates.map(t => t.id));
    continue;
  }
  await delay(600);

  console.log(`  [${catName}] ${templates.length} templates`);

  for (const tpl of templates) {
    const clicked = await clickTemplate(tpl.displayName);
    const boardId = await getNewBoardId(900);
    if (boardId) {
      result[tpl.id] = boardId;
      process.stdout.write(`    ✓ ${tpl.displayName} → ${boardId}\n`);
    } else {
      missing.push(tpl.id);
      process.stdout.write(`    ? ${tpl.displayName} → (none) clicked=${clicked}\n`);
    }
    total++;
  }

  // Click Back to return to category list
  await click('Back', 'button, [class*="back"], [aria-label*="Back"]');
  await delay(500);
}

cdp.close();

// ── Save results ──────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(60)}`);
console.log(`Processed: ${total} templates`);
console.log(`Captured:  ${Object.keys(result).length} board IDs`);
console.log(`Missing:   ${missing.length}`);
if (missing.length) console.log('Missing slugs:', missing.join(', '));

await mkdir('.ms-debug', { recursive: true });
await writeFile('.ms-debug/all-template-boardids.json', JSON.stringify({ result, missing }, null, 2));
console.log('Saved to .ms-debug/all-template-boardids.json');

// Update the knowledge file
const indexPath = 'knowledge/milanote/reference/templates/template-board-ids.json';
await writeFile(indexPath, JSON.stringify(result, null, 2));
console.log(`Written to ${indexPath}`);
