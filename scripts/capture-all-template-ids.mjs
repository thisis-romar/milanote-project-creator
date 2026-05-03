/**
 * Automated capture of board IDs for all 206 Milanote templates.
 * v3: creates a throwaway board via Socket.IO to get a fresh /new-board URL,
 *     runs the full capture with scoped clicks + 1200ms wait, then deletes the board.
 *
 * Run: node scripts/capture-all-template-ids.mjs
 * Do NOT interact with Edge while this runs (~10 minutes).
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

// ── Load catalog + existing results ──────────────────────────────────────
const catalog = JSON.parse(await readFile('knowledge/milanote/reference/templates/template-catalog.json', 'utf-8'));
const collections = catalog.collections;

let existing = {};
try {
  existing = JSON.parse(await readFile('knowledge/milanote/reference/templates/template-board-ids.json', 'utf-8'));
  console.log(`Loaded ${Object.keys(existing).length} existing board IDs — will fill gaps only`);
} catch { console.log('No existing board IDs — starting fresh'); }

// ── CDP setup ─────────────────────────────────────────────────────────────
const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const page = targets.find(t => t.type === 'page' && t.url?.includes('milanote.com'));
if (!page) { console.error('No Milanote page found'); process.exit(1); }
console.log(`Attaching to: ${page.url}`);

const cdp = makeCdp(page.webSocketDebuggerUrl);
await cdp.ready();
await cdp.send('Network.enable');
await cdp.send('Page.enable');

// ── Get cookies for direct API calls ─────────────────────────────────────
const cr = await cdp.send('Network.getCookies', { urls: ['https://app.milanote.com'] });
const hdr = cr.result.cookies.filter(c => c.domain?.includes('milanote')).map(c => `${c.name}=${c.value}`).join('; ');

// Extract userId from cookies
const otParams = cr.result.cookies.find(c => c.name === 'mn-ot-data-subject-params');
let userId = '';
if (otParams) {
  try { userId = JSON.parse(decodeURIComponent(otParams.value)).id ?? ''; } catch {}
}
console.log(`userId: ${userId}`);

// ── Board ID capture monitor ──────────────────────────────────────────────
const HOME_IDS = new Set(['1Wd9Kk1YamXgYd', '1Wd9Kk1YamXgYe', 'wleCaJZxMTHHMV']);
let recentBoardIds = [];
cdp.on(msg => {
  if (msg.method === 'Network.requestWillBeSent') {
    const url = msg.params?.request?.url ?? '';
    const m = url.match(/\/api\/boards\?(?:[^=]+=\w+&)*ids=([A-Za-z0-9]+)/);
    if (m && !HOME_IDS.has(m[1])) recentBoardIds.push(m[1]);
  }
});

// ── Use a pre-created empty board to get the template picker ─────────────
// Board was created via scripts/create-temp-board.mjs before this run.
// Pass it as THROWAWAY_BOARD env variable:
//   THROWAWAY_BOARD=Pa36dK6XzuUQNU node scripts/capture-all-template-ids.mjs
// If not set, we attempt to create one now.
let throwawayBoardId = process.env.THROWAWAY_BOARD ?? null;
if (!throwawayBoardId) {
  const { execSync } = await import('node:child_process');
  process.stderr.write('Creating temp board...\n');
  try {
    throwawayBoardId = execSync('node scripts/create-temp-board.mjs', { timeout: 30_000 }).toString().trim();
    await delay(3500); // wait for server to register
  } catch (e) {
    process.stderr.write(`Failed to create temp board: ${e.message}\n`);
    process.exit(1);
  }
}
console.log(`\nNavigating to ${throwawayBoardId}/new-board...`);
await cdp.send('Page.navigate', { url: `https://app.milanote.com/${throwawayBoardId}/new-board` });
await new Promise(r => {
  const t = setTimeout(r, 20_000);
  cdp.on(m => { if (m.method === 'Page.loadEventFired') { clearTimeout(t); setTimeout(r, 3_500); } });
});

// Final check
const finalUrl = (await cdp.send('Runtime.evaluate', { expression: 'location.href', returnByValue: true })).result?.result?.value ?? '';
const pickerVisible = (await cdp.send('Runtime.evaluate', {
  expression: `JSON.stringify({picker:!!document.querySelector('[class*="TemplatePicker"]'),url:location.href})`,
  returnByValue: true,
})).result?.result?.value;
console.log(`Final state: ${pickerVisible}`);

if (!finalUrl.includes('new-board')) {
  console.error('Template picker not accessible. Cannot proceed.');
  cdp.close();
  process.exit(1);
}

console.log(`\nTemplate picker ready on: ${finalUrl}`);
console.log(`Throwaway board: ${throwawayBoardId}`);

// Dismiss cookie dialog again after navigation
await cdp.send('Runtime.evaluate', {
  expression: `[...document.querySelectorAll("button")].find(b=>b.textContent?.includes("Allow All"))?.click()`,
  returnByValue: true,
});
await delay(500);

// ── Scoped template click helper ──────────────────────────────────────────
const clickTemplateInPane = async (displayName) => {
  const result = await cdp.send('Runtime.evaluate', {
    expression: `(function(name){
      const paneSelectors = ['[class*="TemplatePickerCategoryContent"]','[class*="picker-body"][class*="category"]','[class*="CategoryContent"]','[class*="templateList"]'];
      let container = null;
      for(const sel of paneSelectors){ const el=document.querySelector(sel); if(el){container=el;break;} }
      if(!container) container = document.querySelector('[class*="picker-body"]') || document.querySelector('[class*="TemplatePicker"]');
      if(!container) return 'no container';
      const btns = [...container.querySelectorAll('[class*="TemplateButton"]')];
      const btn = btns.find(b => b.textContent?.trim().startsWith(name));
      if(!btn) return null;
      btn.click();
      return 'clicked: ' + btn.textContent?.trim().slice(0,40);
    })(${JSON.stringify(displayName)})`,
    returnByValue: true,
  });
  return result.result?.result?.value ?? null;
};

const getNewBoardId = async (waitMs = 1200) => {
  recentBoardIds = [];
  await delay(waitMs);
  return recentBoardIds[recentBoardIds.length - 1] ?? null;
};

const clickBack = async () => {
  await cdp.send('Runtime.evaluate', {
    expression: `(function(){ const b=[...document.querySelectorAll('button')].find(el=>el.textContent?.trim().toLowerCase()==='back'); if(b){b.click();return 'back';} return 'no back'; })()`,
    returnByValue: true,
  });
  await delay(450);
};

// ── Open "More templates" ─────────────────────────────────────────────────
await cdp.send('Runtime.evaluate', {
  expression: `[...document.querySelectorAll("button")].find(b=>b.textContent?.includes("More templates"))?.click()`,
  returnByValue: true,
});
await delay(1000);

// ── Process all categories ────────────────────────────────────────────────
const result = { ...existing };
let captured = 0;
let skipped = 0;
console.log('\n=== Processing all categories ===');

for (const collection of collections) {
  const catName = collection.title;
  const catClicked = await cdp.send('Runtime.evaluate', {
    expression: `(function(cat){ const btns=[...document.querySelectorAll('[class*="CategoryButton"],[class*="TemplatePickerListingButton"]')]; const btn=btns.find(b=>b.textContent?.includes(cat)); if(btn){btn.click();return 'clicked';} return 'not found'; })(${JSON.stringify(catName)})`,
    returnByValue: true,
  });
  if (catClicked.result?.result?.value !== 'clicked') {
    console.log(`  [${catName}] SKIP`);
    continue;
  }
  await delay(700);
  console.log(`  [${catName}]`);

  for (const tpl of collection.templates) {
    if (result[tpl.id]) { skipped++; continue; }
    const clicked = await clickTemplateInPane(tpl.displayName);
    const boardId = await getNewBoardId(1200);
    if (boardId) {
      result[tpl.id] = boardId;
      captured++;
      process.stdout.write(`    ✓ ${tpl.displayName} → ${boardId}\n`);
    } else {
      process.stdout.write(`    ? ${tpl.displayName} → (none)\n`);
    }
  }
  await clickBack();
}

// ── Delete the throwaway board ────────────────────────────────────────────
if (throwawayBoardId) {
  console.log(`\nDeleting throwaway board ${throwawayBoardId}...`);
  const del = await fetch(`https://app.milanote.com/api/boards?ids=${throwawayBoardId}`, {
    method: 'DELETE', headers: { cookie: hdr, accept: 'application/json' }
  }).catch(() => null);
  console.log(`Delete status: ${del?.status ?? 'fetch failed'}`);
}
cdp.close();

// ── Save ──────────────────────────────────────────────────────────────────
const total = Object.keys(result).length;
const missing = collections.flatMap(c => c.templates.map(t => t.id)).filter(id => !result[id]);
console.log(`\n${'='.repeat(60)}`);
console.log(`New: ${captured}  Cached: ${skipped}  Total: ${total}/206  Missing: ${missing.length}`);
await mkdir('.ms-debug', { recursive: true });
await writeFile('.ms-debug/all-template-boardids.json', JSON.stringify({ result, missing }, null, 2));
await writeFile('knowledge/milanote/reference/templates/template-board-ids.json', JSON.stringify(result, null, 2));
console.log('Saved to knowledge/milanote/reference/templates/template-board-ids.json');
