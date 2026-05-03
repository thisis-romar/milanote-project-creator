/**
 * Automated template API discovery.
 * Uses CDP to:
 *  1. Navigate to the Milanote new-board page
 *  2. Enable network monitoring
 *  3. Programmatically click every template category via Runtime.evaluate
 *  4. Capture all API calls and response bodies
 */
import WebSocket from 'ws';
import { writeFile, mkdir } from 'node:fs/promises';

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── CDP helper ────────────────────────────────────────────────────────────
function makeCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();
  const listeners = [];

  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    listeners.forEach(fn => fn(msg));
  });

  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = msgId++;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { pending.delete(id); rej(new Error(`CDP timeout: ${method}`)); }, 15_000);
  });

  const on = fn => listeners.push(fn);
  const ready = () => new Promise(r => ws.once('open', r));
  const close = () => ws.close();
  return { send, on, ready, close };
}

// ── Main ──────────────────────────────────────────────────────────────────
const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
console.log('Available Milanote pages:');
const milPages = targets.filter(t => t.type === 'page' && t.url?.includes('milanote.com'));
milPages.forEach(t => console.log(`  ${t.url}`));

// If no Milanote page is open, use any available tab and navigate to Milanote
// Or open a new tab via the browser-level CDP (Target.createTarget)
let targetPage = milPages.find(t => t.url?.includes('1Wd9Kk1YamXgYd')) ?? milPages[0];

if (!targetPage) {
  console.log('No Milanote page open. Navigating existing tab to Milanote...');
  // Navigate the GitHub tab directly to Milanote home (take over the tab)
  const anyPage = targets.find(t => t.type === 'page');
  if (!anyPage) { console.error('No page tabs available'); process.exit(1); }

  const tmpCdp = makeCdp(anyPage.webSocketDebuggerUrl);
  await tmpCdp.ready();
  await tmpCdp.send('Page.enable');
  await tmpCdp.send('Network.enable');
  console.log(`Navigating ${anyPage.url} → Milanote home...`);
  await tmpCdp.send('Page.navigate', { url: 'https://app.milanote.com/1Wd9Kk1YamXgYd/home' });
  // Wait for page load
  await new Promise((res) => {
    const t = setTimeout(res, 20_000); // max wait
    tmpCdp.on(msg => { if (msg.method === 'Page.loadEventFired') { clearTimeout(t); res(); } });
  });
  console.log('Page loaded. Waiting for Milanote app to initialise...');
  await delay(5000);
  tmpCdp.close();

  // Re-fetch targets
  const newTargets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  targetPage = newTargets.find(t => t.type === 'page' && t.url?.includes('milanote'));
  if (!targetPage) { console.error('Could not find Milanote page after navigation'); process.exit(1); }
  console.log(`Now on: ${targetPage.url}`);
}

console.log(`\nUsing: ${targetPage.url}`);
const cdp = makeCdp(targetPage.webSocketDebuggerUrl);
await cdp.ready();

// Get cookies first (before navigating away)
await cdp.send('Network.enable');
const cookieResp = await cdp.send('Network.getCookies', { urls: ['https://app.milanote.com'] });
const cookies = cookieResp.result.cookies.filter(c => c.domain?.includes('milanote'));
const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
console.log(`Got ${cookies.length} cookies`);

// ── Network capture ───────────────────────────────────────────────────────
const requests = new Map(); // requestId → url
const responses = [];

cdp.on(msg => {
  if (msg.method === 'Network.requestWillBeSent') {
    const url = msg.params?.request?.url ?? '';
    if (url.includes('milanote.com') || url.includes('static.milanote')) {
      requests.set(msg.params.requestId, url);
    }
  }
  if (msg.method === 'Network.responseReceived') {
    const url = msg.params?.response?.url ?? '';
    if (url.includes('milanote.com') && !url.endsWith('.js') && !url.endsWith('.css')
        && !url.includes('awswaf') && !url.includes('socket.io')) {
      responses.push({
        url,
        status: msg.params.response.status,
        mimeType: msg.params.response.mimeType,
        requestId: msg.params.requestId,
      });
      console.log(`  [net] ${msg.params.response.status} ${url}`);
    }
  }
});

// ── Navigate to new-board page ────────────────────────────────────────────
// Use the existing New Board (1WjBrd1056Hnap) if it still exists,
// otherwise navigate to the home and open the template picker from there
const NEW_BOARD_ID = '1WjBrd1056Hnap';
const newBoardUrl = `https://app.milanote.com/${NEW_BOARD_ID}/new-board`;

console.log(`\nNavigating to ${newBoardUrl}...`);
await cdp.send('Page.navigate', { url: newBoardUrl });
await cdp.send('Page.enable');
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('Page load timeout')), 20_000);
  cdp.on(msg => {
    if (msg.method === 'Page.loadEventFired') { clearTimeout(t); res(); }
  });
}).catch(() => console.log('  (load event not received, continuing)'));
await delay(3000); // Let React render

// ── Interact with template picker ─────────────────────────────────────────
console.log('\nLooking for template picker...');

const getPickerState = () => cdp.send('Runtime.evaluate', {
  expression: `(function(){
    const modal = document.querySelector('[class*="TemplatePicker"], [class*="template-picker"], [class*="templatePicker"]');
    const moreBtn = [...document.querySelectorAll('button,span,div')].find(el => el.textContent?.trim() === 'More templates...');
    const items = [...document.querySelectorAll('[class*="template"], [class*="Template"]')].map(el => ({tag:el.tagName,cls:el.className.slice(0,80),text:el.textContent?.trim().slice(0,50)})).slice(0,10);
    return JSON.stringify({hasModal:!!modal,hasMoreBtn:!!moreBtn,items});
  })()`,
  returnByValue: true,
});

const state1 = await getPickerState();
console.log('Picker state:', state1.result?.result?.value);

// Click "More templates..." if visible
console.log('\nClicking "More templates..."...');
const clickMoreResult = await cdp.send('Runtime.evaluate', {
  expression: `(function(){
    const btn = [...document.querySelectorAll('*')].find(el =>
      el.textContent?.trim() === 'More templates...' ||
      el.textContent?.trim() === 'More templates'
    );
    if(!btn) return 'not found';
    btn.click();
    return 'clicked: ' + btn.tagName + ' ' + btn.className.slice(0,60);
  })()`,
  returnByValue: true,
});
console.log('Click result:', clickMoreResult.result?.result?.value);
await delay(2000);

// Find and click all category items
console.log('\nFinding template categories...');
const categoriesResult = await cdp.send('Runtime.evaluate', {
  expression: `(function(){
    // Look for list items that could be category buttons
    const allClickable = [...document.querySelectorAll('button, [role="button"], li, [class*="item"], [class*="row"], [class*="category"]')];
    const candidates = allClickable.filter(el => {
      const text = el.textContent?.trim();
      return text && text.length > 2 && text.length < 60 && !text.includes('Continue') && !text.includes('Keep example');
    }).map(el => ({text: el.textContent?.trim().slice(0,50), cls: el.className?.slice(0,60), tag: el.tagName}));
    return JSON.stringify(candidates.slice(0,30));
  })()`,
  returnByValue: true,
});
const categories = JSON.parse(categoriesResult.result?.result?.value ?? '[]');
console.log('Found clickable items:');
categories.forEach(c => console.log(`  [${c.tag}] ${c.text} (${c.cls.slice(0,40)})`));

// Click each category that looks like a template category
const categoryNames = ['Agencies','Architecture','Brand Strategy','Content Creation','Craft & Makers',
  'Creative Direction','Fashion Design','Film / TV','Game Design','Graphic Design','Illustration',
  'Interior Design','Lifestyle & Personal','Logo Design','Management & Strategy','Marketing Campaign',
  'Marketing Strategy','Moodboarding','Motion Design','Photography','Podcasting','Product Management',
  'Productivity','Renovation & DIY','Software Development','Startups','Students',
  'UX/UI/Product Design','Visual Art','Website Design','Writing'];

for (const catName of categoryNames) {
  const clickResult = await cdp.send('Runtime.evaluate', {
    expression: `(function(){
      const el = [...document.querySelectorAll('*')].find(el => el.textContent?.trim() === ${JSON.stringify(catName)});
      if(!el) return 'not found: ' + ${JSON.stringify(catName)};
      el.click();
      return 'clicked: ' + el.tagName + ' "' + el.textContent?.trim().slice(0,40) + '"';
    })()`,
    returnByValue: true,
  });
  const msg = clickResult.result?.result?.value ?? '';
  console.log(`  ${catName}: ${msg}`);
  await delay(800);

  // Click back button after each category
  await cdp.send('Runtime.evaluate', {
    expression: `(function(){
      const back = [...document.querySelectorAll('button,[role="button"],[class*="back"],[class*="Back"]')]
        .find(el => el.textContent?.trim().toLowerCase().includes('back') || el.getAttribute('aria-label')?.toLowerCase().includes('back'));
      if(back){ back.click(); return 'back clicked'; }
      return 'no back';
    })()`,
    returnByValue: true,
  });
  await delay(400);
}

// ── Collect response bodies ───────────────────────────────────────────────
console.log(`\nCollecting ${responses.length} response bodies...`);
for (const resp of responses) {
  try {
    const bodyResp = await cdp.send('Network.getResponseBody', { requestId: resp.requestId });
    resp.body = bodyResp.result?.body ?? null;
  } catch { resp.body = null; }
}

cdp.close();

// ── Save results ──────────────────────────────────────────────────────────
await mkdir('.ms-debug', { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outPath = `.ms-debug/template-capture-${ts}.json`;
await writeFile(outPath, JSON.stringify(responses, null, 2));

console.log(`\n${'='.repeat(60)}`);
console.log(`Captured ${responses.length} API responses`);
console.log(`Saved to: ${outPath}`);
console.log('\nAll URLs captured:');
responses.forEach(r => console.log(`  ${r.status} ${r.url}`));

// Extract template-related responses
const templateResponses = responses.filter(r =>
  r.url.includes('template') || r.url.includes('Template') ||
  (r.body && (r.body.includes('template') || r.body.includes('Template') || r.body.includes('Moodboard')))
);
if (templateResponses.length > 0) {
  console.log('\n=== TEMPLATE API FOUND ===');
  templateResponses.forEach(r => {
    console.log(`  ${r.url}`);
    if (r.body) console.log('  Body preview:', r.body.slice(0, 300));
  });
}
