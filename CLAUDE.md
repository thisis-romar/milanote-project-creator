---
title: milanote-project-creator
description: CLAUDE.md for the milanote-project-creator TypeScript CLI
version: 0.4.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-05-05T00:00:00Z
---

# milanote-project-creator

TypeScript CLI that programmatically creates Milanote boards from JSON templates. Complements `milanote-extractor` (reads boards) by adding write capability with `{{variable}}` substitution, nested boards, and asset uploads.

**Auth:** CDP-attach to the user's live Edge profile — no session file, no login flow.
**Driver:** Socket.IO v4 collab channel primary; REST returns null tokens for workspace root, so Socket.IO carries the auth; Playwright UI fallback per step in `UiCreator`.

## Architecture

**Entry point:**
- `src/index.ts` — Commander.js CLI (`milanote-creator` binary)

**Module map:**

| Module | Directory | Responsibility |
|--------|-----------|----------------|
| CDP | `src/cdp/` | Attach to Edge via `--remote-debugging-port`; find/open Milanote tab |
| API | `src/api/` | Rate-limited HTTP client; endpoint discovery probe; Zod response types |
| UI driver | `src/ui/` | Playwright fallback for every create operation; DOM selectors |
| Template | `src/template/` | Zod schema, JSON parser, `{{var}}` substitution, asset upload |
| Creator | `src/creator/` | Orchestrator that drives ApiCreator + UiCreator with per-step fallback |
| Commands | `src/commands/` | `create`, `probe`, `validate`, `delete`, `workspaces`, `attach` |

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Run CLI in development mode (tsx) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm test` | Run tests (Vitest) |
| `npm run lint` | Lint source (ESLint) |
| `npm run format` | Format source (Prettier) |
| `npm run typecheck` | Type-check without emitting |
| `npm run brain:build` | Print instructions to rebuild the knowledge graph |
| `npm run brain:query` | Query the graphify knowledge graph |
| `npm run lint:fix` | Auto-fix lint errors (ESLint --fix) |
| `npm run test:watch` | Run tests in watch mode (Vitest) |
| `npm run frames` | Extract video frames via CDP screenshot script |

### CLI Commands

| Command | Description |
|---------|------------|
| `milanote-creator create <template.json> [--var k=v]... [--workspace <id>] [--dry-run] [--force] [--folder <id>] [--url <url>]` | Create a board from a JSON template |
| `milanote-creator validate <template.json>` | Validate a template against the schema without creating |
| `milanote-creator delete <board-id>` | Delete a board by ID |
| `milanote-creator workspaces` | List all workspaces visible to the active session |
| `milanote-creator attach` | Attach CDP to Edge and confirm the Milanote tab is reachable |
| `milanote-creator probe` | Discover Milanote's API endpoint shapes (self-cleaning) |

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Milanote Knowledge Brain

See `.claude/agents/milanote-specialist.md` for supported primitives, playbook index, and citation contract.

**Knowledge brain:** `knowledge/milanote/` — reference docs + playbooks, indexed by graphify.
- Query: `npm run brain:query "<question>"` or `/graphify query "<question>"`
- Rebuild: `/graphify knowledge/milanote knowledge/audit` (the `brain:build` npm script is a stub — run the skill instead)
- 19 video transcripts in `knowledge/milanote/reference/videos/` (indexed; some visual-context entries still pending — tracked in #1 sub-issues #22–#26)

## Branch protection & PR workflow

Repo is public. Branch ruleset #15999991 (`Require PRs to master`) is active:
- All merges to `master` require a pull request + 1 approval
- Direct push and force-push are blocked

**Project automation (GitHub project #6):**
- New issues are auto-added to the project board
- PR merge auto-closes the linked issue and flips its status to "Done"
- Sub-issues are auto-attached to the project when a parent is added

**Convention:** include `Closes #N` in every PR body to trigger auto-close + project status flip.

**CI:** `.github/workflows/ci.yml` runs `typecheck`, `lint`, and `test` on every PR and push to `master`. After the first CI run registers the `check` job name, it can be added as a required status check on the ruleset.

## Code Conventions

- TypeScript strict mode, ES2022 target, NodeNext module resolution
- `import type` for type-only imports
- Named exports, one concern per file
- Async/await throughout; never swallow exceptions silently
- All `.md` files carry YAML frontmatter: `title`, `description`, `version`, `created`, `last_updated`
- All `.ts`/`.js`/`.sh` files carry JSDoc/comment version headers

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | CLI entry, all command definitions |
| `src/types.ts` | Shared TypeScript interfaces |
| `src/template/schema.ts` | Zod schema — canonical definition of all supported Milanote card types |
| `src/api/probe.ts` | Self-cleaning endpoint discovery harness |
| `src/api/collab-socket.ts` | Socket.IO v4 collab channel — primary auth + create path |
| `src/api/inspector.ts` | Passive XHR probe for endpoint shape discovery |
| `src/creator/orchestrator.ts` | Per-step ApiCreator → UiCreator fallback driver |
| `scripts/lib/edge-cdp.mjs` | CDP helpers (lifted from milanote-extractor) |
| `knowledge/milanote/reference/concepts/intro-video-2026-04-29.md` | Official Milanote intro — canonical primitive set |
