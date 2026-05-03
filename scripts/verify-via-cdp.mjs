/**
 * Verify board contents using direct CDP page-level WebSocket (bypasses browser-level connectOverCDP).
 * Connects to a specific Milanote tab target to extract cookies, then queries the API.
 */
import WebSocket from 'ws';

const CDP_BASE = 'http://127.0.0.1:9222';

// Get all CDP targets
const targets = await fetch(`${CDP_BASE}/json`).then(r => r.json());
const milanoteHome = targets.find(t => t.type === 'page' && t.url?.includes('milanote.com/1Wd9Kk1YamXgYd'));
const milanoteAny  = targets.find(t => t.type === 'page' && t.url?.includes('milanote.com'));

const target = milanoteHome ?? milanoteAny;
if (!target) { console.error('No Milanote page found'); process.exit(1); }
console.log(`Using target: ${target.url}`);

// Connect to this page's WebSocket debugger
const ws = new WebSocket(target.webSocketDebuggerUrl);
let msgId = 1;
const pending = new Map();

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 10000);
  });
}

await new Promise(r => ws.once('open', r));

// Enable network to get cookies
await send('Network.enable');
const cookieResp = await send('Network.getCookies', { urls: ['https://app.milanote.com'] });
const cookies = cookieResp?.result?.cookies ?? cookieResp?.cookies ?? [];
console.log(`Cookie response keys: ${JSON.stringify(Object.keys(cookieResp ?? {}))}`);
const cookieHeader = cookies.filter(c => c.domain?.includes('milanote')).map(c => `${c.name}=${c.value}`).join('; ');
ws.close();

console.log(`Got ${cookies.length} Milanote cookies`);

// Now use the cookies to query the API
const BOARDS = {
  'v2 — Nomad Toronto AV Rack v2': 'wleCaJZxMTHHMV',
  'v1 (new, this session)':        'XYx4R7DkNNLKBt',
  'old board (prev session)':       'rxfkC4C9MFSZks',
  'home':                           '1Wd9Kk1YamXgYd',
  'IvsEEJkd8ZJmRX':                 'IvsEEJkd8ZJmRX',
};

const EXPECTED_CONVOS = [
  '81ef8190', '61c49787', 'c8999358', 'bfe45378', 'fb56aa22', '77927477', '5b4811a9'
];

async function fetchElems(id) {
  const r = await fetch(`https://app.milanote.com/api/elements?ids=${id}&includeChildren=true`, {
    headers: { cookie: cookieHeader, accept: 'application/json' }
  });
  return (await r.json()).elements ?? {};
}

for (const [label, id] of Object.entries(BOARDS)) {
  const elems = await fetchElems(id);
  const count = Object.keys(elems).length;
  const byType = {};
  for (const el of Object.values(elems)) {
    const t = el.elementType ?? '?';
    byType[t] = (byType[t] ?? 0) + 1;
  }
  const boards  = Object.entries(elems).filter(([eid, el]) => el.elementType === 'BOARD' && eid !== id);
  const links   = Object.entries(elems).filter(([, el])  => el.elementType === 'LINK');
  console.log(`\n[${label}] ${id}`);
  console.log(`  elements: ${count}  types: ${JSON.stringify(byType)}`);
  for (const [bid, b] of boards.slice(0,10))
    console.log(`  BOARD  ${bid}  "${b.content?.title ?? ''}"  parent=${b.location?.parentId ?? ''}`);
  for (const [lid, l] of links.slice(0,10))
    console.log(`  LINK   ${lid}  url=${l.content?.url ?? l.content?.originalUrl ?? '(none)'}  title="${l.content?.title ?? ''}"`);
}
