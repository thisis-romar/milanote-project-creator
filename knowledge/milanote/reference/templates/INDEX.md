---
title: Milanote Official Template Catalog
description: Complete catalog of all 206 official Milanote templates across 31 categories, with template slugs and discovered board IDs
version: 1.0.0
created: 2026-05-03T00:00:00Z
last_updated: 2026-05-03T00:00:00Z
discovery_method: CDP React fiber extraction from template picker UI
---

# Milanote Official Template Catalog

## Discovery Method

Extracted from the React `templateCollections` prop inside the `TemplatePicker` component via CDP `Runtime.evaluate`. Template board IDs discovered by monitoring `Network.requestWillBeSent` events while clicking each template.

Templates are stored as **regular Milanote boards** with pre-assigned IDs. Applying a template fetches `GET /api/boards?ids=<boardId>` — no dedicated `/api/templates` endpoint exists.

## Stats

- **31 categories**, **206 templates** total
- Largest category: UX/UI/Product Design (14 templates)
- Smallest: Illustration (3 templates)

## Featured Templates (top-level picker)

| Template | Board ID | Notes |
|---|---|---|
| Empty board | `1IrtkU2poegU5K` | Blank canvas |
| Moodboard (TOP PICK) | `1Is8Y72poehbgf` | Most popular |
| Project Plan | — | Board ID TBD |
| Storyboard | `1Irq5F2poegS19` | |
| Creative Brief | `1Isafu2poehldL` | |
| Weekly Plan | — | Board ID TBD |

## All Categories

See `template-catalog.json` for the full machine-readable catalog with all 206 template slugs and display names.

| Category | Count | Notable Templates |
|---|---|---|
| Agencies | 9 | Agency Hub, Campaign Brief, Moodboard |
| Architecture | 5 | Design Concept, Architectural Project Plan |
| Brand Strategy | 9 | Brand Audit, Brand Strategy Project, Customer Persona |
| Content Creation | 7 | YouTube Channel Plan, Video Script |
| Craft & Makers | 5 | Craft Project Plan, Craft Moodboard |
| Creative Direction | 5 | Advertising Brief, Campaign Plan |
| Fashion Design | 5 | Fashion Lookbook, Fashion Moodboard |
| Film / TV | 9 | Beat Sheet, Call Sheet, Pre-production Plan |
| Game Design | 12 | Game Design Document, RPG Campaign Map |
| Graphic Design | 8 | Design Brief, Logo Project Plan |
| Illustration | 3 | Illustrative Moodboard |
| Interior Design | 4 | Interior Design Brief, Product List |
| Lifestyle & Personal | 5 | Vision Board, Wedding Moodboard |
| Logo Design | 7 | Logo Brief, Assets Handover |
| Management & Strategy | 5 | Competitor Landscape, Team Structure |
| Marketing Campaign | 9 | Campaign Strategy, Social Media Calendar |
| Marketing Strategy | 4 | Marketing Plan, Customer Persona |
| Moodboarding | 7 | Fashion, Film, Design, Illustrative |
| Motion Design | 6 | Storyboard, Style Frames |
| Photography | 9 | Photoshoot Plan, Shot List |
| Podcasting | 6 | Podcast Script, Podcast Schedule |
| Product Management | 6 | Product Roadmap, Customer Journey Map |
| Productivity | 5 | Kanban Board, Eisenhower Matrix |
| Renovation & DIY | 4 | Renovation Moodboard, Project Plan |
| Software Development | 4 | Agile Task Board, Technical Architecture |
| Startups | 5 | Lean Canvas, Startup Hub |
| Students | 5 | Class Notes, Research Proposal |
| UX/UI/Product Design | 14 | User Flow Diagram, Site Map, UX Storyboard |
| Visual Art | 5 | Art Moodboard, Art Project Plan |
| Website Design | 8 | Website Plan, User Flow Diagram |
| Writing | 11 | Novel Plan, Story Map, World Building |

## Next Steps

1. Click through all 206 templates to capture board IDs for each
2. Fetch `GET /api/elements?ids=<boardId>&includeChildren=true` for each to document structure
3. Write one `.md` file per template with element breakdown
4. Run `/graphify knowledge/milanote/reference/templates --update` to index into brain
