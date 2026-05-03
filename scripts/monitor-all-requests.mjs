/**
 * Broad network monitor — captures ALL XHR/fetch requests from Milanote pages.
 * Run this, THEN click the New Board → open template picker → browse ALL categories.
 */
import WebSocket from 'ws';
import { writeFile, mkdir } from 'node:fs/promises';

const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const milanotePages = targets.filter(t => t.type === 'page' && t.url?.includes('milanote.com'));

console.log('Monitoring pages:');
milanotePages.forEach(t => console.log(`  ${t.url}`));

const captured = [];
const sockets = [];

for (const target of milanotePages) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();

  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }

    // Capture ALL requests going out
    if (msg.method === 'Network.requestWillBeSent') {
      const url = msg.params?.request?.url ?? '';
      const method = msg.params?.request?.method ?? '';
      // Skip obvious non-API requests
      if (!url.includes('.js') && !url.includes('.css') && !url.includes('.png') &&
          !url.includes('.ico') && !url.includes('google-analytics') && !url.includes('hotjar') &&
          !url.includes('nr-data.net') && !url.includes('awswaf') &&
          !url.includes('adnxs.com') && !url.includes('recaptcha')) {
        captured.push({ type: 'request', method, url, requestId: msg.params?.requestId, pageUrl: target.url });
        process.stdout.write(`> ${method} ${url.slice(0, 100)}\n`);
      }
    }
  });

  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = msgId++;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { pending.delete(id); rej(new Error(method)); }, 5000);
  });

  await new Promise(r => ws.once('open', r));
  await send('Network.enable').catch(() => {});
  sockets.push(ws);
}

console.log(`\n${'='.repeat(60)}`);
console.log('READY. Please do this now:');
console.log('  1. Click the "New Board" thumbnail on your home canvas');
console.log('  2. When the template picker opens, click "More templates..."');
console.log('  3. Click through EVERY category in the list');
console.log('  4. Come back here — monitoring for 90 seconds');
console.log('='.repeat(60) + '\n');

await new Promise(r => setTimeout(r, 90_000));
sockets.forEach(ws => ws.close());

await mkdir('.ms-debug', { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
await writeFile(`.ms-debug/all-requests-${ts}.json`, JSON.stringify(captured, null, 2));

console.log(`\n${'='.repeat(60)}`);
console.log(`Captured ${captured.length} requests.`);
console.log('\nUnique URLs:');
[...new Set(captured.map(c => `${c.method} ${c.url}`))].forEach(u => console.log('  ' + u));
console.log(`\nSaved to .ms-debug/all-requests-${ts}.json`);
