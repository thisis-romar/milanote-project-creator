/**
 * Real-time network monitor — waits for the Milanote template picker API call.
 * Run BEFORE opening the template picker. Then click any template category.
 */
import WebSocket from 'ws';
import { writeFile, mkdir } from 'node:fs/promises';

const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
console.log('Open Milanote pages:');
targets.filter(t => t.type === 'page' && t.url?.includes('milanote.com'))
       .forEach(t => console.log(`  [${t.id.slice(0,8)}] ${t.url}`));

// Connect to ALL Milanote page targets simultaneously
const milanotePages = targets.filter(t => t.type === 'page' && t.url?.includes('milanote.com'));
const captured = [];

async function monitorPage(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();

  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }

    if (msg.method === 'Network.responseReceived') {
      const url = msg.params?.response?.url ?? '';
      if (url.includes('milanote.com') && !url.includes('socket.io') && !url.includes('.js') && !url.includes('.css')) {
        const entry = {
          url,
          status: msg.params?.response?.status,
          requestId: msg.params?.requestId,
          pageUrl: target.url,
        };
        captured.push(entry);
        console.log(`  ${entry.status} ${url}`);
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
  return ws;
}

const sockets = await Promise.all(milanotePages.map(monitorPage));
console.log(`\nMonitoring ${sockets.length} Milanote pages for 60s...`);
console.log('NOW: click the "New Board" on your home canvas to open it, then open the template picker.\n');

await new Promise(r => setTimeout(r, 60_000));
sockets.forEach(ws => ws.close());

// Filter for template-related calls
const templateCalls = captured.filter(c =>
  c.url.includes('template') || c.url.includes('Template') ||
  c.url.includes('collection') || c.url.includes('board') ||
  c.url.includes('category')
);

console.log(`\nCaptured ${captured.length} API calls total.`);
console.log(`Template-related: ${templateCalls.length}`);
console.log('\nAll captured URLs:');
[...new Set(captured.map(c => `${c.status} ${c.url}`))].forEach(u => console.log('  ' + u));

await mkdir('.ms-debug', { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
await writeFile(`.ms-debug/template-monitor-${ts}.json`, JSON.stringify(captured, null, 2));
console.log(`\nSaved to .ms-debug/template-monitor-${ts}.json`);
