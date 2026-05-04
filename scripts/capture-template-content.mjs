/**
 * @file capture-template-content.mjs
 * @description Attempt to capture real Milanote template content via CDP WebSocket interception.
 *
 * STATUS: Template content is server-side protected — this script currently captures 0 elements.
 * See knowledge/milanote/reference/api/collab-protocol.md § "Template board content" for full
 * findings. All approaches were tested: REST API (SKELETON only), direct URL navigation (redirects),
 * Socket.IO replay (0 frames), CDP frame interception (doesn't fire post-navigation), WebSocket hook
 * injection (hook runs but captures nothing), and browser "Use this template" (server rejects duplication).
 *
 * Left in the codebase as a reference implementation. The WebSocket injection approach (injecting
 * a hook via Page.addScriptToEvaluateOnNewDocument) is the most promising path if Milanote's
 * permissions model changes or if a privileged API key becomes available.
 *
 * Usage:
 *   node scripts/capture-template-content.mjs --slug kanban-board-template  # test single
 *   node scripts/capture-template-content.mjs --force                        # force re-run
 */
import WebSocket from 'ws';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const delay = ms => new Promise(r => setTimeout(r, ms));

// ELEMENT_CREATE actions arrive as: 42N["action", { type: "ELEMENT_CREATE", ... }]
const ACTION_RE = /^42\d*\["action",(.+)\]$/s;

// ── CLI args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const slugArg = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
const force = args.includes('--force');

// ── CDP helper (lifted from capture-all-template-ids.mjs) ─────────────────
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

const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const page = targets.find(t => t.type === 'page' && t.url?.includes('milanote.com'));
if (!page) { console.error('No Milanote page found in Edge'); process.exit(1); }
console.log(`Attaching to: ${page.url}`);

const cdp = makeCdp(page.webSocketDebuggerUrl);
await cdp.ready();
await cdp.send('Page.enable');

// ── WebSocket interceptor injected into every page load ────────────────────
// CDP Network.webSocketFrameReceived doesn't reliably fire after page navigation.
// Instead, we inject a script via Page.addScriptToEvaluateOnNewDocument that
// hooks the WebSocket constructor before the SPA initialises. All inbound frames
// are stored in window.__wsMessages and read back via Runtime.evaluate.
//
// For SPA navigations (no full reload), the hook persists on the existing WS;
// we clear window.__wsMessages = [] before each navigation and read after.
const WS_HOOK_SCRIPT = `
  window.__wsMessages = [];
  (function() {
    var OrigWS = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      var ws = protocols ? new OrigWS(url, protocols) : new OrigWS(url);
      ws.addEventListener('message', function(evt) {
        if (typeof evt.data === 'string' && /^[0-9]/.test(evt.data)) {
          window.__wsMessages.push(evt.data);
        }
      });
      return ws;
    };
    Object.setPrototypeOf(window.WebSocket, OrigWS);
    window.WebSocket.prototype = OrigWS.prototype;
    window.WebSocket.CONNECTING = OrigWS.CONNECTING;
    window.WebSocket.OPEN = OrigWS.OPEN;
    window.WebSocket.CLOSING = OrigWS.CLOSING;
    window.WebSocket.CLOSED = OrigWS.CLOSED;
  })();
`;

await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: WS_HOOK_SCRIPT });

// ── Helper: read captured frames from page context ─────────────────────────
const readFrames = async () => {
  const r = await cdp.send('Runtime.evaluate', {
    expression: 'JSON.stringify(window.__wsMessages || [])',
    returnByValue: true,
  });
  try { return JSON.parse(r.result?.result?.value ?? '[]'); } catch { return []; }
};

// ── Load catalog ──────────────────────────────────────────────────────────
const boardIds = JSON.parse(await readFile('knowledge/milanote/reference/templates/template-board-ids.json', 'utf-8'));
const catalog = JSON.parse(await readFile('knowledge/milanote/reference/templates/template-catalog.json', 'utf-8'));

const slugInfo = {};
for (const col of catalog.collections) {
  for (const tpl of col.templates) {
    slugInfo[tpl.id] = { category: col.title, displayName: tpl.displayName };
  }
}
for (const t of [
  { id: 'moodboard', displayName: 'Moodboard', category: 'Featured' },
  { id: 'project-plan', displayName: 'Project Plan', category: 'Featured' },
  { id: 'storyboard-template', displayName: 'Storyboard', category: 'Featured' },
  { id: 'creative-brief-template', displayName: 'Creative Brief', category: 'Featured' },
  { id: 'weekly-plan-template', displayName: 'Weekly Plan', category: 'Featured' },
  { id: 'empty-board', displayName: 'Empty Board', category: 'Featured' },
]) slugInfo[t.id] = { category: t.category, displayName: t.displayName };

// ── Frame parser ──────────────────────────────────────────────────────────
function parseAction(payload) {
  try {
    const m = payload.match(ACTION_RE);
    if (!m) return null;
    return JSON.parse(m[1]);
  } catch { return null; }
}

// ── Element tree builder ──────────────────────────────────────────────────
function buildTree(boardId, elems) {
  const typeCounts = {};
  const columnMap = {};
  const subboards = [];
  const freeform = [];
  const taskMap = {};

  for (const [id, el] of Object.entries(elems)) {
    const type = el.elementType ?? '?';
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    const parentId = el.location?.parentId;

    if (type === 'COLUMN' && parentId === boardId) {
      columnMap[id] = {
        id,
        title: el.content?.title ?? '(untitled)',
        cards: [],
        score: el.location?.position?.score ?? 0,
      };
    } else if (type === 'BOARD' && id !== boardId) {
      subboards.push({ id, title: el.content?.title ?? '(untitled)', description: el.content?.description });
    } else if (type === 'TASK') {
      if (!taskMap[parentId]) taskMap[parentId] = [];
      taskMap[parentId].push({
        text: el.content?.textContent ?? '',
        done: el.content?.done ?? false,
        score: el.location?.position?.score ?? el.location?.position?.index ?? 0,
      });
    } else if (['CARD', 'LINK', 'TASK_LIST', 'IMAGE', 'COLOR_SWATCH', 'FILE'].includes(type)) {
      const card = {
        id,
        type,
        title: el.content?.title ?? el.content?.textContent?.slice(0, 80) ?? '',
        url: el.content?.url,
        hex: el.content?.hex,
        parentId,
        score: el.location?.position?.score ?? el.location?.position?.index ?? 0,
      };
      if (parentId === boardId) freeform.push(card);
      else if (columnMap[parentId]) columnMap[parentId].cards.push(card);
    }
  }

  const columns = Object.values(columnMap).sort((a, b) => a.score - b.score);
  for (const col of columns) {
    col.cards.sort((a, b) => a.score - b.score);
    for (const card of col.cards) {
      if (card.type === 'TASK_LIST') {
        card.tasks = (taskMap[card.id] ?? []).sort((a, b) => a.score - b.score);
      }
    }
  }
  freeform.sort((a, b) => a.score - b.score);
  for (const card of freeform) {
    if (card.type === 'TASK_LIST') card.tasks = (taskMap[card.id] ?? []).sort((a, b) => a.score - b.score);
  }

  return { typeCounts, columns, subboards, freeform, total: Object.keys(elems).length };
}

// ── Markdown card line ────────────────────────────────────────────────────
function cardLine(card, indent = '') {
  const lines = [];
  if (card.type === 'COLOR_SWATCH') {
    lines.push(`${indent}- [SWATCH] ${card.hex ?? card.title}`);
  } else if (card.type === 'LINK') {
    lines.push(`${indent}- [LINK] ${card.title || card.url || '(no title)'}${card.url ? ` (${card.url})` : ''}`);
  } else if (card.type === 'IMAGE') {
    lines.push(`${indent}- [IMAGE] ${card.title || '(image)'}`);
  } else if (card.type === 'FILE') {
    lines.push(`${indent}- [FILE] ${card.title || '(file)'}`);
  } else if (card.type === 'TASK_LIST') {
    lines.push(`${indent}- [TO-DO] ${card.title || '(checklist)'}`);
    for (const t of card.tasks ?? []) {
      lines.push(`${indent}  - [${t.done ? 'x' : ' '}] ${t.text || '(empty)'}`);
    }
  } else {
    lines.push(`${indent}- [NOTE] ${card.title || '(empty)'}`);
  }
  return lines.join('\n');
}

// ── Markdown builder ──────────────────────────────────────────────────────
function buildMarkdown(slug, boardId, info, tree, capturedAt, contentCaptured) {
  const lines = [
    `---`,
    `slug: ${slug}`,
    `displayName: "${info.displayName}"`,
    `category: "${info.category}"`,
    `boardId: ${boardId}`,
    `elementCount: ${tree.total}`,
    `elementTypes: ${JSON.stringify(tree.typeCounts)}`,
    `contentCaptured: ${contentCaptured}`,
    `capturedAt: ${capturedAt}`,
    `---`,
    ``,
    `# ${info.displayName}`,
    ``,
  ];

  if (tree.columns.length) {
    lines.push(`## Columns (${tree.columns.length})`);
    lines.push('');
    for (const col of tree.columns) {
      lines.push(`### ${col.title}`);
      if (col.cards.length) {
        for (const card of col.cards) lines.push(cardLine(card));
      } else {
        lines.push('_(empty)_');
      }
      lines.push('');
    }
  }

  if (tree.subboards.length) {
    lines.push(`## Subboards (${tree.subboards.length})`);
    for (const sub of tree.subboards) {
      lines.push(`- ${sub.title}${sub.description ? ` — ${sub.description}` : ''}`);
    }
    lines.push('');
  }

  if (tree.freeform.length) {
    lines.push(`## Freeform canvas (${tree.freeform.length})`);
    for (const card of tree.freeform) lines.push(cardLine(card));
    lines.push('');
  }

  return lines.join('\n');
}

// ── Main capture loop ─────────────────────────────────────────────────────
await mkdir('.ms-debug', { recursive: true });

let entries = Object.entries(boardIds);

if (slugArg) {
  entries = entries.filter(([slug]) => slug === slugArg);
  if (!entries.length) { console.error(`Unknown slug: ${slugArg}`); cdp.close(); process.exit(1); }
}

// Deduplicate by boardId — some slugs share the same board (e.g. duplicate-category templates)
const seenBoards = new Set();
entries = entries.filter(([, boardId]) => {
  if (seenBoards.has(boardId)) return false;
  seenBoards.add(boardId);
  return true;
});

// Check which are already captured (unless --force or --slug)
if (!force && !slugArg) {
  const uncaptured = [];
  for (const [slug, boardId] of entries) {
    const info = slugInfo[slug] ?? { category: 'Unknown', displayName: slug };
    const catDir = info.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
    const outPath = path.join('knowledge/milanote/reference/templates', catDir, `${slug}.md`);
    try {
      const existing = await readFile(outPath, 'utf-8');
      if (!existing.includes('contentCaptured: true')) uncaptured.push([slug, boardId]);
    } catch { uncaptured.push([slug, boardId]); }
  }
  const skippedCount = entries.length - uncaptured.length;
  if (skippedCount) console.log(`Skipping ${skippedCount} already-captured templates (use --force to re-capture)`);
  entries = uncaptured;
}

if (!entries.length) { console.log('Nothing to capture.'); cdp.close(); process.exit(0); }

console.log(`\nCapturing ${entries.length} template boards...`);
if (!slugArg) console.log('Do NOT interact with Edge during capture.\n');

let captured = 0;
let skeletonOnly = 0;
let probesSaved = 0;

for (const [slug, boardId] of entries) {
  const info = slugInfo[slug] ?? { category: 'Unknown', displayName: slug };
  const catDir = info.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
  const outPath = path.join('knowledge/milanote/reference/templates', catDir, `${slug}.md`);

  // Clear message buffer before navigation (works for both full reload + SPA nav)
  await cdp.send('Runtime.evaluate', {
    expression: 'window.__wsMessages = []; void 0',
    returnByValue: true,
  }).catch(() => {});

  // Navigate — triggers full page reload; WS hook injected by addScriptToEvaluateOnNewDocument
  // runs before socket.io initialises, capturing all inbound frames from the start
  await cdp.send('Page.navigate', { url: `https://app.milanote.com/${boardId}` });

  // Wait for HTTP load then extra time for socket.io collab replay to arrive
  await new Promise(resolve => {
    let done = false;
    const t = setTimeout(() => { if (!done) { done = true; resolve(); } }, 12_000);
    cdp.on(m => {
      if (m.method === 'Page.loadEventFired' && !done) {
        done = true;
        clearTimeout(t);
        setTimeout(resolve, 4_000); // 4s for collab replay
      }
    });
  });

  // Dismiss cookie dialog if present
  await cdp.send('Runtime.evaluate', {
    expression: `[...document.querySelectorAll("button")].find(b=>b.textContent?.includes("Allow All"))?.click()`,
    returnByValue: true,
  }).catch(() => {});

  // Read frames captured by the injected WebSocket hook
  const allFrames = await readFrames();

  // Save first 2 raw captures for protocol documentation
  if (probesSaved < 2 && allFrames.length > 0) {
    const probeFile = `.ms-debug/collab-replay-${slug}.json`;
    await writeFile(probeFile, JSON.stringify({ slug, boardId, frameCount: allFrames.length, frames: allFrames.slice(0, 60) }, null, 2), 'utf-8');
    probesSaved++;
  }

  // Parse ELEMENT_CREATE actions into element map
  const elems = {};
  for (const frame of allFrames) {
    const action = parseAction(frame);
    if (!action || action.type !== 'ELEMENT_CREATE') continue;
    if (!action.id || !action.elementType) continue;
    // Skip the board itself (we only want children)
    if (action.id === boardId) continue;
    elems[action.id] = { elementType: action.elementType, location: action.location, content: action.content };
  }

  const contentCaptured = Object.keys(elems).length > 0;
  const tree = buildTree(boardId, elems);
  const capturedAt = new Date().toISOString();
  const markdown = buildMarkdown(slug, boardId, info, tree, capturedAt, contentCaptured);

  await mkdir(path.join('knowledge/milanote/reference/templates', catDir), { recursive: true });
  await writeFile(outPath, markdown, 'utf-8');

  if (contentCaptured) {
    captured++;
    const counts = `cols=${tree.columns.length} freeform=${tree.freeform.length} subs=${tree.subboards.length} elems=${tree.total}`;
    process.stdout.write(`  ✓ ${info.displayName} (${counts})\n`);
  } else {
    skeletonOnly++;
    process.stdout.write(`  ~ ${info.displayName} (no replay — still SKELETON, ${allFrames.length} frames received)\n`);
  }

  await delay(300);
}

// Navigate back to home workspace
await cdp.send('Page.navigate', { url: 'https://app.milanote.com/1Wd9Kk1YamXgYd/home' });
await delay(1_000);
cdp.close();

console.log(`\n${'='.repeat(60)}`);
console.log(`Captured with content: ${captured}`);
console.log(`Still SKELETON-only:   ${skeletonOnly}`);
console.log(`Total processed:       ${captured + skeletonOnly}`);

if (probesSaved > 0) {
  console.log(`\nRaw frame probes saved to .ms-debug/collab-replay-<slug>.json`);
  console.log('These document the server replay format — update collab-protocol.md with the discovered shapes.');
}

if (captured > 0) {
  console.log('\nNext step: /graphify knowledge/milanote --update to index enriched content');
}
