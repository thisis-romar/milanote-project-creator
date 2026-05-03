/**
 * Fetch element structure for each known template board ID and write a .md file.
 * Zero storage impact — only reads existing template boards via GET.
 *
 * Run: node scripts/fetch-template-structures.mjs
 */
import WebSocket from 'ws';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Cookies ───────────────────────────────────────────────────────────────
const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const page = targets.find(t => t.type === 'page' && t.url?.includes('milanote.com'));
const ws = new WebSocket(page.webSocketDebuggerUrl);
let wsId = 1; const pending = new Map();
ws.on('message', raw => { const m = JSON.parse(raw); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const wsSend = (method, params = {}) => new Promise((res, rej) => {
  const i = wsId++; pending.set(i, res);
  ws.send(JSON.stringify({ id: i, method, params }));
  setTimeout(() => { pending.delete(i); rej(new Error(method)); }, 8000);
});
await new Promise(r => ws.once('open', r));
await wsSend('Network.enable');
const cr = await wsSend('Network.getCookies', { urls: ['https://app.milanote.com'] });
ws.close();
const hdr = cr.result.cookies.filter(c => c.domain?.includes('milanote')).map(c => `${c.name}=${c.value}`).join('; ');

// ── Load data ─────────────────────────────────────────────────────────────
const boardIds = JSON.parse(await readFile('knowledge/milanote/reference/templates/template-board-ids.json', 'utf-8'));
const catalog = JSON.parse(await readFile('knowledge/milanote/reference/templates/template-catalog.json', 'utf-8'));

// Build slug → category + displayName lookup
const slugInfo = {};
for (const col of catalog.collections) {
  for (const tpl of col.templates) {
    slugInfo[tpl.id] = { category: col.title, displayName: tpl.displayName };
  }
}
// Add featured templates
const featured = [
  { id: 'moodboard', displayName: 'Moodboard', category: 'Featured' },
  { id: 'project-plan', displayName: 'Project Plan', category: 'Featured' },
  { id: 'storyboard-template', displayName: 'Storyboard', category: 'Featured' },
  { id: 'creative-brief-template', displayName: 'Creative Brief', category: 'Featured' },
  { id: 'weekly-plan-template', displayName: 'Weekly Plan', category: 'Featured' },
  { id: 'empty-board', displayName: 'Empty Board', category: 'Featured' },
];
for (const t of featured) slugInfo[t.id] = { category: t.category, displayName: t.displayName };

// ── API helper ────────────────────────────────────────────────────────────
async function fetchBoard(boardId) {
  const r = await fetch(`https://app.milanote.com/api/elements?ids=${boardId}&includeChildren=true`, {
    headers: { cookie: hdr, accept: 'application/json' },
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data.elements ?? {};
}

// Recursively fetch subboard children
async function fetchSubboard(boardId, depth = 0) {
  if (depth > 2) return {};
  const elems = await fetchBoard(boardId);
  if (!elems) return {};
  const subs = Object.entries(elems).filter(([id, el]) => el.elementType === 'BOARD' && id !== boardId);
  for (const [subId] of subs) {
    const subElems = await fetchBoard(subId);
    if (subElems) Object.assign(elems, subElems);
    await delay(100);
  }
  return elems;
}

// ── Process each template ─────────────────────────────────────────────────
const entries = Object.entries(boardIds);
console.log(`Fetching structures for ${entries.length} templates...`);

let written = 0;
for (const [slug, boardId] of entries) {
  const info = slugInfo[slug] ?? { category: 'Unknown', displayName: slug };
  const catDir = info.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');

  const elems = await fetchBoard(boardId);
  if (!elems) {
    console.log(`  ✗ ${slug} (${boardId}) — fetch failed`);
    continue;
  }

  const total = Object.keys(elems).length;
  const typeCounts = {};
  const columns = [];
  const freeformCards = [];
  const subboards = [];

  for (const [id, el] of Object.entries(elems)) {
    const type = el.elementType ?? '?';
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;

    if (type === 'COLUMN') {
      columns.push({ id, title: el.content?.title ?? '(untitled)' });
    } else if (type === 'BOARD' && id !== boardId) {
      subboards.push({ id, title: el.content?.title ?? '(untitled)', description: el.content?.description });
    } else if (['CARD', 'LINK', 'TASK_LIST', 'IMAGE', 'COLOR_SWATCH', 'FILE'].includes(type)) {
      const parent = el.location?.parentId;
      if (parent === boardId) {
        freeformCards.push({ type, title: el.content?.title ?? el.content?.textContent?.slice(0, 60) ?? '', url: el.content?.url });
      }
    }
  }

  // Build markdown
  const lines = [
    `---`,
    `slug: ${slug}`,
    `displayName: "${info.displayName}"`,
    `category: "${info.category}"`,
    `boardId: ${boardId}`,
    `elementCount: ${total}`,
    `elementTypes: ${JSON.stringify(typeCounts)}`,
    `---`,
    ``,
    `# ${info.displayName}`,
    ``,
  ];

  if (columns.length) {
    lines.push(`## Columns (${columns.length})`);
    for (const col of columns) lines.push(`- ${col.title}`);
    lines.push('');
  }

  if (subboards.length) {
    lines.push(`## Subboards (${subboards.length})`);
    for (const sub of subboards) {
      lines.push(`- ${sub.title}${sub.description ? ` — ${sub.description}` : ''}`);
    }
    lines.push('');
  }

  if (freeformCards.length) {
    lines.push(`## Freeform canvas (${freeformCards.length})`);
    for (const card of freeformCards) {
      lines.push(`- [${card.type}] ${card.title}${card.url ? ` (${card.url})` : ''}`);
    }
    lines.push('');
  }

  const content = lines.join('\n');
  const outDir = path.join('knowledge/milanote/reference/templates', catDir);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, `${slug}.md`), content, 'utf-8');
  written++;
  process.stdout.write(`  ✓ ${info.displayName} (${total} elems: ${JSON.stringify(typeCounts)})\n`);
  await delay(150); // rate limit
}

console.log(`\nWritten ${written} template structure files.`);
console.log('Directories created under knowledge/milanote/reference/templates/');
