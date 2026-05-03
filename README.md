# milanote-project-creator

TypeScript CLI that creates Milanote boards from JSON templates. Complements `milanote-extractor` (reads boards) by adding write capability with `{{variable}}` substitution, nested subboards, and type-safe templates.

**Auth:** CDP-attach to a live Edge profile — no login flow, no session file.  
**Transport:** All mutations go through Milanote's Socket.IO v4 collab server (`wss://app.milanote.com/socket.io/`) — REST `POST /api/elements` was found to return null permission tokens for workspace root boards under cookie auth.

---

## Quick start

```bash
npm install
npm run dev -- --help

# Validate a template without creating anything
npm run dev -- validate templates/nomad-av-rack.json

# Dry-run: print the creation plan
npm run dev -- create templates/nomad-av-rack.json --dry-run

# Live: create the board (Edge must be open and logged in to Milanote)
npm run dev -- create templates/nomad-av-rack.json

# Create inside an isolation folder (safe for iterating on templates)
npm run dev -- create templates/nomad-av-rack.json --folder "Test run 1"

# Show the current workspace board ID and list boards inside it
npm run dev -- workspaces

# Delete a board by ID
npm run dev -- delete <boardId>
```

---

## CLI reference

| Command | Description |
|---|---|
| `create <template.json>` | Create a board from a JSON template |
| `validate <template.json>` | Validate a template without creating |
| `delete <boardId>` | Delete a board via Socket.IO |
| `workspaces` | Show workspace board ID and list child boards |
| `probe` | Capture XHR + WebSocket traffic for protocol discovery |
| `attach` | Smoke-test CDP attach (prints page title and URL) |

### `create` options

| Flag | Description |
|---|---|
| `--var key=value` | Override a template variable (repeatable) |
| `-w, --workspace <id>` | Target workspace board ID (default: read from page URL) |
| `--dry-run` | Print the plan without creating anything |
| `--force` | Skip duplicate-title check |
| `--folder <name>` | Wrap content inside an isolation folder board |
| `-u, --url <url>` | URL to load if no Milanote tab is open |

---

## Template format

```jsonc
{
  "$schema": "https://example.com/milanote-template.schema.json",
  "version": 1,
  "variables": {
    "venue": "My Venue",
    "system": { "default": "Generic System", "description": "System name" }
  },
  "board": {
    "title": "{{venue}} — Overview",
    "description": "Optional description",
    "columns": [
      {
        "title": "Column Title",
        "cards": [
          { "type": "note", "text": "Plain text note" },
          { "type": "checklist", "title": "Tasks", "items": [{ "text": "Item 1", "done": false }] }
        ]
      }
    ],
    "freeform": [
      { "type": "link", "url": "https://example.com", "title": "Link title" },
      { "type": "swatch", "hex": "#FF5733", "label": "Brand Red" },
      {
        "type": "board",
        "title": "Subboard",
        "freeform": [
          { "type": "note", "text": "Nested note" }
        ]
      }
    ]
  }
}
```

### Supported card types

| Type | Required fields | Notes |
|---|---|---|
| `note` | `text` | Plain text |
| `link` | `url` | Validated as URL; `title`, `description` optional |
| `image` | `src` | Local path or URL; `caption` optional |
| `file` | `path` | Local path — **schema validates but creation throws** (signed S3 upload not yet implemented) |
| `swatch` | `hex` | 6-digit hex color; `label` optional |
| `checklist` | `items[]` | Each item: `{ text, done? }` |
| `board` | `title` | Nested subboard; supports `columns`, `freeform`, `description` |

---

## Architecture

```
src/
  index.ts              CLI entry (Commander.js)
  commands/
    create.ts           create command — attaches, pre-flights, runs orchestrator
    delete.ts           delete command — auto-resolves parent, sends ELEMENT_DELETE
    workspaces.ts       workspaces command — lists boards in current workspace
    validate.ts         validate command — parse + schema check only
    probe.ts            probe command — XHR + WebSocket capture
  api/
    client.ts           Rate-limited HTTP client (cookie auth)
    collab-socket.ts    Socket.IO v4 client — all element mutations
    creator.ts          ApiCreator — implements Creator interface via CollabSocket
    inspector.ts        Pre-flight: duplicate check, workspace snapshot, verification
    probe.ts            XHR intercept harness
  cdp/
    attach.ts           CDP attach to live Edge (--remote-debugging-port=9222)
    page.ts             Find or open a Milanote tab
  creator/
    orchestrator.ts     Walk template tree, delegate to Creator, primary→fallback
    plan.ts             Build flat step list for --dry-run and progress output
    types.ts            Creator interface, BoardRef, NotImplementedError
  template/
    schema.ts           Zod schema — canonical definition of all card types
    parser.ts           Parse JSON, substitute {{vars}}, validate
    variables.ts        {{variable}} substitution engine
  ui/
    driver.ts           UiCreator — Playwright fallback (selectors still TODO)
    selectors.ts        DOM selectors (board-loaded set only; card selectors TODO)
```

### Socket.IO v4 protocol

Milanote uses Engine.IO 4 + Socket.IO 4 on `wss://app.milanote.com/socket.io/`.

```
Handshake:
  Server → 0{...}           EIO open
  Client → 40               SIO connect
  Server → 40 or 40{...}    SIO connected

Action frames:
  Client → 42N["action", payload]   N = sequential counter (string-appended, NOT added)
  Server → 2 / Client → 3          heartbeat ping/pong

Error frames (detected):
  Server → 44{...}                  SIO error packet
  Server → 42[...]"error"[...]      error event
```

Key discoveries from protocol probe:
- `ELEMENT_UPDATE` uses `{ updates: [{ id, data: {...} }] }` (not `content`)
- Color swatches use element type `COLOR_SWATCH` (not `SWATCH`)
- Cards inside columns: `parentId = column.id`, `section = "INBOX"`
- Cards on board canvas: `parentId = board.id`, `section = "CANVAS"`
- `update-channels` must be sent after each `USER_NAVIGATE` before `ELEMENT_CREATE`
- Board creation requires ~800ms before children can be created inside it

---

## Safeguards

Every live `create` run:
1. **Snapshots** the workspace to `.ms-debug/workspace-snapshot-<ts>.json` (newest 10 kept)
2. **Checks for duplicates** — aborts if a board with the same title already exists (`--force` bypasses)
3. **Acquires a lock** — `.ms-debug/.lock-<workspaceId>` prevents concurrent runs
4. **Verifies** — fetches the root board after creation and prints element count

Use `--folder <name>` to wrap a test run in an isolation board, which skips the duplicate check entirely.

---

## Development

```bash
npm run dev             # tsx watch mode
npm run typecheck       # tsc --noEmit
npm test                # vitest run (51 tests)
npm run lint            # eslint src
npm run format          # prettier --write src
```

### Knowledge brain

The project has a graphify knowledge graph at `graphify-out/`.

```bash
# Query the graph
npm run brain:query "<question>"

# Rebuild after code changes
# Run in Claude Code:  /graphify knowledge/milanote knowledge/audit --update
```

### Edge CDP prerequisite

Start Edge with remote debugging enabled:

```
msedge.exe --remote-debugging-port=9222 --user-data-dir="%USERPROFILE%\EdgeCDPProfile"
```

Or add it to the Edge shortcut target. All CLI commands that attach to a live session require this.
