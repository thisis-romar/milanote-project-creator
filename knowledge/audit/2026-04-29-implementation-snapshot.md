---
title: Implementation Snapshot — 2026-04-29
description: What's built in milanote-project-creator as of end-of-day 2026-04-29, what works, what's stubbed pending probe data
version: 1.0.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

# Implementation Snapshot — 2026-04-29

Documents the state of `milanote-project-creator` after a single-day scaffold-to-skeleton sprint. Phases 0-4 of the implementation plan are committed; Phase 5 (manual integration test) and full Phase 6 (per-primitive playbook fill-in) are blocked on probe data.

## What works end-to-end

| Capability | Command | Status |
|---|---|---|
| Scaffold + hooks + lint + typecheck + tests | `npm run typecheck && npm run lint && npm test` | green (19/19 tests) |
| CDP attach to live Edge | `npm run dev attach` | works |
| Passive XHR capture (probe) | `npm run dev probe -- --duration 180` | works (untested against real session — needs user) |
| Template parse + variable resolution + validation | `npm run dev validate templates/sneaker-logo-design.json --var brandName=X` | works |
| Plan generation (dry-run) | `npm run dev create templates/sneaker-logo-design.json --dry-run` | works |

The dry-run plan output for the sneaker example:

```
→ board Voltura - Logo Design — Logo direction for Voltura, owned by Romar, due 2026-06-15.
  → column Brief
    → card[note] Design a logo for Voltura ...
    → card[checklist] Project tasks - 6 items
  → column Inspiration
    → card[link] Fonts In Use - Sneakers
    → card[image] Reference: high-contrast hero shot composition
  → column Color palette
    → card[swatch] #0F172A Midnight
    → card[swatch] #F97316 Sunset
    [3 more swatches]
  → freeform <canvas>
    → subboard Visual References
      → freeform <canvas>
        → card[note] Drag in inspiration images here.
        → card[image] Texture study

Totals: swatch=5, column=3, note=2, image=2, freeform=2, board=1, checklist=1, link=1, subboard=1
```

## What's stubbed (pending probe)

| Component | Stub location | Unblocker |
|---|---|---|
| `ApiCreator` (all 4 methods) | `src/api/creator.ts` | One probe session capturing create flows for board/column/card/subboard, then promote shapes to `src/api/types.ts` |
| `UiCreator` (all 4 methods) | `src/ui/driver.ts` | DevTools inspection of create gestures; populate `src/ui/selectors.ts` TODO table |
| Asset upload | `src/template/assets.ts` (interface only) | Probe captures upload-sign + upload-PUT + element-create flow |

## Architecture summary

```
src/
├── index.ts              CLI entry (Commander)
├── cdp/                  Edge CDP attach + tab finder
│   ├── edge.ts           CDP launch (TS port of milanote-extractor)
│   ├── attach.ts         attachToEdge() returns connected Browser
│   └── page.ts           getOrOpenMilanotePage()
├── api/                  HTTP layer
│   ├── client.ts         MilanoteClient (token bucket, 3 burst, 1/s)
│   ├── probe.ts          captureNetwork() — passive XHR listener
│   ├── creator.ts        ApiCreator (stubbed)
│   └── types.ts          CapturedRequest, ProbeResult, ProbeSummary
├── ui/                   Playwright driver
│   ├── driver.ts         UiCreator (stubbed)
│   └── selectors.ts      DOM selectors (BOARD_LOADED set + TODO table)
├── template/             Template engine
│   ├── schema.ts         Zod: 7 card primitives + recursive board, depth 5
│   ├── parser.ts         readFile → JSON.parse → Zod → resolveTree → re-validate → depth check
│   ├── variables.ts      {{var}} / {{env.NAME}} substitution + tree walk
│   ├── assets.ts         AssetUploader interface (stubbed)
│   └── schema.test.ts    19 tests, all passing
├── creator/              Orchestration
│   ├── types.ts          Creator interface, BoardRef/ColumnRef/CardRef
│   ├── plan.ts           buildPlan() + printPlan() + summarize()
│   └── orchestrator.ts   createFromTemplate() with API → UI fallback
└── commands/
    ├── probe.ts          probe command
    ├── validate.ts       validate command
    └── create.ts         create command (works in --dry-run; live mode errors with probe hint)

scripts/lib/edge-cdp.mjs  Verbatim copy from milanote-extractor for parity
templates/sneaker-logo-design.json  Example covering every primitive

knowledge/
├── milanote/
│   ├── README.md
│   ├── reference/
│   │   ├── concepts/intro-video-2026-04-29.md
│   │   ├── elements/INDEX.md
│   │   ├── templates/format-spec.md
│   │   └── videos/{INDEX, 3 transcripts}.md
│   └── playbooks/
│       ├── discovering-the-api.md
│       ├── freeform-vs-columnar-layout.md
│       ├── handling-rate-limits.md
│       ├── nesting-boards.md
│       └── uploading-assets.md
└── audit/
    ├── 2026-04-29-initial-probe.md           (probe-tooling-ready)
    └── 2026-04-29-implementation-snapshot.md (this file)
```

## Commits

```
787edbc feat(template): Phase 3 — template engine, schema, variable substitution
ebc0fc3 feat(api):      Phase 2 — passive XHR probe + rate-limited client
e1741e2 docs(brain):    ingest Milanote tutorial playlist transcripts
716aacd feat(agents):   add youtube-transcript-collector subagent
2242507 feat(cdp):      Phase 1 — CDP attach to live Edge
763da4b feat:           scaffold milanote-project-creator — Phase 0 complete
... + Phase 4 + Phase 6 brain seed
```

## Next concrete actions

1. **User runs `npm run dev probe -- --duration 240`** while manually creating one of each card type in Milanote. Save the resulting `.ms-debug/probe-*.json`.
2. Promote captured request/response shapes to `src/api/types.ts` and per-element docs in `knowledge/milanote/reference/elements/<type>.md`.
3. Implement `ApiCreator.createRootBoard` first — smallest end-to-end path. Test by running `npm run dev create templates/sneaker-logo-design.json` and seeing a real board appear.
4. Iterate per primitive in priority order: column, note, swatch, link, checklist, image, file, subboard.
5. Author per-primitive playbooks as evidence accumulates.
6. Re-run `/graphify knowledge/milanote knowledge/audit` after each significant addition.
