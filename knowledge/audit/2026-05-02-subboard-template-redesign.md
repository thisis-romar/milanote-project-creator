---
title: "Audit: Nomad AV Rack template — subboard redesign"
description: Template redesigned to give each conversation its own Milanote subboard with artifacts
version: 1.0.0
created: 2026-05-02T19:32:07Z
last_updated: 2026-05-02T19:32:07Z
---

# Nomad AV Rack Template Redesign — Subboard-per-Conversation

## Context

Previous template (`templates/nomad-av-rack.json`) used 4 columns with link cards.
Redesigned to give each conversation its own subboard containing the conversation link
plus note cards for every artifact generated in that conversation.

## New structure

```
Root board: Nomad Toronto — AV Rack
├── column: System (note + 7-item checklist)
└── freeform canvas (8 subboards in 3-column grid, 40-unit spacing):
    ├── Amp Rack Cable Schedule          → link + 5 artifact notes
    ├── Audio Rack Equipment Audit       → link + 7 artifact notes (28 total, key ones)
    ├── CQ12 Mixer System Diagram        → link + 2 artifact notes
    ├── Yamaha MG12 I/O Corrections      → link + 1 artifact note
    ├── 19-Inch Rack Architecture        → link + 1 artifact note
    ├── SVG Rack Elevation Diagram Skill → link + 1 artifact note
    ├── Business & Monetization          → link + 3 artifact notes
    └── System Color Reference           → 5 color swatches
```

## Artifacts discovered per conversation

Source: claude-conversation-reader `.ccr-import.sqlite` + live API fetch.

| Conversation | Artifact count | Notable files |
|---|---|---|
| `81ef8190` — Cable Schedule | 5 | nomad_connection_diagram.svg, nomad_cable_schedule.docx, nomad_cable_labels.pdf |
| `61c49787` — Audit & Rewiring | 28 | nomad_wiring_diagram_final.pdf, nomad_system_spec_armonia.docx, audio-system-diagram.skill, nomad_wiring_svg.jsx |
| `c8999358` — CQ12 Diagram | 4 (2 unique) | nomad-wiring-diagram.jsx (v12), nomad_io_audit.txt |
| `bfe45378` — MG12 Corrections | 1 | nomad725-Sound-System-Spec-Mar16-2k26-corrected.docx |
| `fb56aa22` — 19" Standards | 1 | Verifying 19-Inch Rack Standards.md |
| `77927477` — SVG Skill | 1 | SVG Rack Elevation Diagrams — A Complete Technical Reference.md |
| `5b4811a9` — Monetization | 3 | 3 strategic-research markdown reports |
| `54db5ad6` — System Overview | 0 | 404 — inaccessible (possibly deleted or different org) |

## Canvas coordinate system findings

Confirmed from DOM bounding box inspection:
- **1 canvas unit ≈ 7 screen pixels** at 100% zoom
- Column visual width: 270px ≈ 38.6 canvas units → use 40-unit column slots
- Subboard thumbnail: ~230px × 170px ≈ 33 × 24 canvas units
- Freeform grid: 3-column, 40-unit col-width, 30-unit row-height, y-start at 60

## Board created

URL: https://app.milanote.com/rxfkC4C9MFSZks/nomad-toronto--av-rack
Template: `templates/nomad-av-rack.json` (v2 — subboard-per-conversation)
