/**
 * Direct CDP probe for Milanote template API discovery.
 * Connects to a page-level CDP target (not browser-level) to avoid Playwright timeout.
 *
 * Run: node scripts/probe-templates.mjs
 * While running: click through ALL template categories in the Milanote template picker.
 * Do NOT click "Continue". Just browse categories and hover template names.
 */
import WebSocket from 'ws';
import { writeFile, mkdir } from 'node:fs/promises';

const CDP = 'http://127.0.0.1:9222';
const DURATION_MS = 120_000; // 2 minutes

// Find the best Milanote page target — prefer the new-board page (template picker lives there)
const targets = await fetch(`${CDP}/json`).then(r => r.json());
const milanotePages = targets.filter(t => t.type === 'page' && t.url?.includes('milanote.com'));
console.log('Milanote pages found:');
milanotePages.forEach(t => console.log(`  ${t.url}`));
const newBoard = milanotePages.find(t => t.url?.includes('new-board'));
const target = newBoard ?? milanotePages[0];

if (!target) { console.error('No Milanote page open'); process.exit(1); }
console.log(`Attaching to page: ${target.url}`);
console.log(`Now browse ALL template categories in the template picker. DO NOT click Continue.`);
console.log(`Running for ${DURATION_MS / 1000}s...\n`);

const ws = new WebSocket(target.webSocketDebuggerUrl);
let msgId = 1;
const pending = new Map();
const captured = [];

ws.on('message', raw => {
  const msg = JSON.parse(raw.toString());
  // Resolve pending commands
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }

  // Capture network events
  if (msg.method === 'Network.responseReceived') {
    const url = msg.params?.response?.url ?? '';
    if (url.includes('milanote.com/api') || url.includes('milanote.com/template')) {
      captured.push({ type: 'xhr', url, status: msg.params?.response?.status, requestId: msg.params?.requestId });
      console.log(`  XHR ${msg.params?.response?.status} ${url}`);
    }
  }
  if (msg.method === 'Network.webSocketCreated') {
    const url = msg.params?.url ?? '';
    if (url.includes('milanote')) console.log(`  WS created: ${url}`);
  }
});

const send = (method, params = {}) => new Promise((res, rej) => {
  const id = msgId++;
  pending.set(id, res);
  ws.send(JSON.stringify({ id, method, params }));
  setTimeout(() => { pending.delete(id); rej(new Error(`Timeout: ${method}`)); }, 10_000);
});

await new Promise(r => ws.once('open', r));
await send('Network.enable');
await send('Network.setRequestInterception', { patterns: [] }); // monitor only, don't intercept

// Also capture response bodies for template-related requests
ws.on('message', async raw => {
  const msg = JSON.parse(raw.toString());
  if (msg.method === 'Network.loadingFinished') {
    const match = captured.find(c => c.requestId === msg.params?.requestId && !c.body);
    if (match) {
      try {
        const resp = await send('Network.getResponseBody', { requestId: msg.params.requestId });
        match.body = resp.result?.body ?? null;
      } catch { /* ignore */ }
    }
  }
});

// Wait for the probe duration
await new Promise(r => setTimeout(r, DURATION_MS));
ws.close();

// Save results
await mkdir('.ms-debug', { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outPath = `.ms-debug/template-probe-${ts}.json`;
await writeFile(outPath, JSON.stringify(captured, null, 2));

console.log(`\n${'='.repeat(60)}`);
console.log(`Captured ${captured.length} Milanote API calls`);
console.log(`Saved to: ${outPath}`);
console.log('\nTemplate-related URLs found:');
const templateUrls = [...new Set(captured.map(c => c.url).filter(u => u.includes('template') || u.includes('Template')))];
if (templateUrls.length) {
  templateUrls.forEach(u => console.log(`  ${u}`));
} else {
  console.log('  (none with "template" in URL — check all captured URLs below)');
  captured.forEach(c => console.log(`  ${c.status} ${c.url}`));
}
