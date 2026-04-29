---
title: Milanote Brain
description: Curated knowledge corpus for milanote-project-creator — reference docs, playbooks, and audit reports indexed by graphify
version: 0.1.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# Milanote Brain

Curated knowledge corpus for the `milanote-project-creator` CLI. Indexed into `graphify-out/` by the graphify skill.

## Corpus structure

```
knowledge/milanote/
├── README.md                          ← this file
├── reference/                         ← fetched/discovered docs
│   ├── api/                           ← reverse-engineered API shapes, headers, auth model
│   ├── ui/                            ← DOM selectors, canvas behavior
│   ├── elements/                      ← per element type: note, link, image, file, swatch, checklist, board
│   ├── templates/                     ← template JSON spec with annotated examples
│   └── concepts/                      ← high-level concepts (intro video, freeform canvas model)
└── playbooks/                         ← hand-written runbooks (one per task)
knowledge/audit/                       ← dated state-of-the-world reports
```

## Building the graph

```bash
# Run in Claude Code (not the npm stub)
/graphify knowledge/milanote knowledge/audit
```

The `npm run brain:build` script just prints these instructions. The actual build is done via the `/graphify` skill in Claude Code.

## Querying the graph

```bash
npm run brain:query "how do I create a nested board"
npm run brain:query "what is the swatch card schema"
# Or in Claude Code:
/graphify query "what endpoints does the probe use"
```

## Conventions

- Every `.md` file carries YAML frontmatter: `title`, `description`, `version`, `created`, `last_updated`
- Reference docs fetched from external URLs include `<!-- source: URL -->` in the body
- Audit files use dated filenames: `YYYY-MM-DD-<topic>.md`
- Playbooks use present-tense imperative titles: `creating-a-board.md`, not `how-to-create-a-board.md`

## Post-mutation protocol

After any structural discovery (new endpoint, new selector, behavioral gotcha):
1. Update the relevant `reference/` doc
2. If it's a reusable pattern, create/update a playbook
3. Append to `knowledge/audit/` with a dated file
4. Rebuild the graph: `/graphify knowledge/milanote knowledge/audit`
