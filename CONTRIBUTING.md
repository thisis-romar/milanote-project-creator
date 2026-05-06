---
title: Contributing to milanote-project-creator
description: Developer setup, workflow, and conventions for contributors
version: 1.0.0
created: 2026-05-05T00:00:00Z
last_updated: 2026-05-05T00:00:00Z
---

# Contributing

## Setup

```bash
git clone https://github.com/thisis-romar/milanote-project-creator.git
cd milanote-project-creator
npm install
```

Requires Node 22+, a Chromium-based Edge installation, and `--remote-debugging-port=9222` enabled on your Edge profile.

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Run CLI via tsx (no build step) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | ESLint on `src/` |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run format` | Prettier on `src/` |
| `npm test` | Run test suite (Vitest) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run frames` | Extract video frames via CDP screenshot script |
| `npm run brain:query` | Query the graphify knowledge graph |

## CDP attach pattern

Before running `create`, `delete`, or any command that drives the browser, attach CDP first:

```bash
milanote-creator attach
```

This confirms Edge is reachable on port 9222 with a live Milanote tab. If it fails, launch Edge with `--remote-debugging-port=9222` and navigate to `app.milanote.com`.

## Milanote primitives

The knowledge brain at `knowledge/milanote/` documents all supported card types, layout rules, and playbooks. Read `knowledge/milanote/reference/concepts/intro-video-2026-04-29.md` for the canonical primitive set. Query via:

```bash
npm run brain:query "<question>"
```

The `.claude/agents/milanote-specialist.md` defines the citation contract for referencing brain entries in code comments.

## Branch protection

Merges to `master` require a pull request with at least 1 approval (ruleset #15999991). Direct pushes are blocked. The CI workflow (`.github/workflows/ci.yml`) runs `typecheck`, `lint`, and `test` on every PR.

## Issue linking

Include `Closes #N` in your PR body. This triggers GitHub project automation to auto-close the linked issue and flip its status to "Done" on the project board when the PR merges.

## Knowledge brain

If you add new docs or modify source files, refresh the graph afterward:

```bash
/graphify update .
```
