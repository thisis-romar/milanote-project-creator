---
title: milanote-project-creator
description: CLAUDE.md for the milanote-project-creator TypeScript CLI
version: 0.1.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# milanote-project-creator

TypeScript CLI that programmatically creates Milanote boards from JSON templates. Complements `milanote-extractor` (reads boards) by adding write capability with `{{variable}}` substitution, nested boards, and asset uploads.

**Auth:** CDP-attach to the user's live Edge profile — no session file, no login flow.
**Driver:** API probe first, Playwright UI fallback per step.

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
| Commands | `src/commands/` | `create`, `probe`, `validate` |

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

### CLI Commands

| Command | Description |
|---------|------------|
| `milanote-creator create <template.json> [--var k=v]... [--workspace <id>] [--dry-run]` | Create a board from a JSON template |
| `milanote-creator probe` | Discover Milanote's API endpoint shapes (self-cleaning) |
| `milanote-creator validate <template.json>` | Validate a template against the schema without creating |

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
| `scripts/lib/edge-cdp.mjs` | CDP helpers (lifted from milanote-extractor) |
| `knowledge/milanote/reference/concepts/intro-video-2026-04-29.md` | Official Milanote intro — canonical primitive set |
