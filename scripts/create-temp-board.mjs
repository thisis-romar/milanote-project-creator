/**
 * Creates a single empty board via Socket.IO and prints its ID.
 * Used by capture-all-template-ids.mjs to get a /new-board URL.
 * Usage: node scripts/create-temp-board.mjs
 * Output: just the board ID on stdout (parseable by caller)
 */
import WebSocket from 'ws';

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Extract cookies via CDP ───────────────────────────────────────────────
const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const page = targets.find(t => t.type === 'page' && t.url?.includes('milanote.com'));
if (!page) { process.stderr.write('No Milanote page\n'); process.exit(1); }

const cdpWs = new WebSocket(page.webSocketDebuggerUrl);
let cdpId = 1;
const cdpPending = new Map();
cdpWs.on('message', raw => { const m = JSON.parse(raw); if (m.id && cdpPending.has(m.id)) { cdpPending.get(m.id)(m); cdpPending.delete(m.id); } });
const cdpSend = (method, params = {}) => new Promise((res, rej) => {
  const i = cdpId++;
  cdpPending.set(i, res);
  cdpWs.send(JSON.stringify({ id: i, method, params }));
  setTimeout(() => { cdpPending.delete(i); rej(new Error(method)); }, 8000);
});
await new Promise(r => cdpWs.once('open', r));
await cdpSend('Network.enable');
const cr = await cdpSend('Network.getCookies', { urls: ['https://app.milanote.com'] });
cdpWs.close();

const cookies = cr.result.cookies.filter(c => c.domain?.includes('milanote'));
const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

// Extract userId
const otParams = cookies.find(c => c.name === 'mn-ot-data-subject-params');
let userId = '';
if (otParams) {
  try { userId = JSON.parse(decodeURIComponent(otParams.value)).id ?? ''; } catch {}
}

// ── Connect Socket.IO ─────────────────────────────────────────────────────
const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const genId = () => Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

const wsUrl = `wss://app.milanote.com/socket.io/?userId=${userId}&EIO=4&transport=websocket`;
const sio = new WebSocket(wsUrl, { headers: { cookie: cookieHeader }, handshakeTimeout: 10_000 });

let counter = 0;
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('SIO connect timeout')), 15_000);
  sio.on('message', raw => {
    const msg = raw.toString();
    if (msg.startsWith('0')) { sio.send('40'); return; }
    if (msg === '40' || msg.startsWith('40{')) { clearTimeout(t); resolve(); return; }
    if (msg === '2') sio.send('3');
  });
  sio.on('error', reject);
});

const sioSend = (action) => new Promise((res, rej) => {
  const n = counter++;
  const frame = `42${n}["action",${JSON.stringify(action)}]`;
  sio.send(frame, err => err ? rej(err) : res());
});

// ── Create empty board in workspace ──────────────────────────────────────
const HOME = '1Wd9Kk1YamXgYd';
const boardId = genId();
const now = Date.now();
const clientId = genId().slice(0, 6);
const sessionId = `msid-${genId().slice(0, 10)}`;
const deviceId = `mdid-${genId().slice(0, 10)}`;

// USER_NAVIGATE to home
await sioSend({
  type: 'USER_NAVIGATE', timestamp: now, sync: true,
  user: { _id: userId, clientId, clientTick: counter },
  deviceId, sessionId,
  channels: [`${HOME}-LIVE`],
  newBoardId: HOME, permissionId: null, permission: 31, persist: true,
  navigationSource: 'web',
  monitoring: { operation: 'GENERAL', requestMode: 'bufferFlush' },
  activity: { track: true, isPreviousBoardShared: false, isNewBoardShared: false },
});
await delay(100);

// update-channels
const ucp = {
  joined: [userId, `${HOME}-LIVE`, `${userId}-PERSONAL`, HOME],
  left: [], bufferFlush: true, replay: true,
  monitoring: { requestMode: 'bufferFlush' },
};
const n2 = counter++;
await new Promise((res, rej) => {
  sio.send(`42${n2}["update-channels",${JSON.stringify(ucp)}]`, err => err ? rej(err) : res());
});
await delay(150);

// ELEMENT_CREATE BOARD
await sioSend({
  type: 'ELEMENT_CREATE', timestamp: now, sync: true,
  user: { _id: userId, clientId, clientTick: counter },
  deviceId, sessionId,
  channels: [`${HOME}-LIVE`],
  id: boardId, elementType: 'BOARD',
  location: { parentId: HOME, section: 'CANVAS', position: { x: 50, y: 50, score: 65536 } },
  content: { title: '_template_capture_temp' },
  meta: { creator: userId, modifiedBy: userId, createdTime: now, modifiedTime: now, platform: 'Desktop web', locationSectionModifiedTime: now, versionId: `${sessionId}-1` },
});
await delay(500);
sio.close();

// Output just the board ID for the caller to parse
process.stdout.write(boardId + '\n');
