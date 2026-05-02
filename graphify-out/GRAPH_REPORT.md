# Graph Report - knowledge/milanote + knowledge/audit  (2026-05-02)

## Corpus Check
- 29 files · ~39,352 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 141 nodes · 150 edges · 19 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.86)
- Token cost: 12,000 input · 3,000 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Video Tutorials|Video Tutorials]]
- [[_COMMUNITY_Milanote Primitives|Milanote Primitives]]
- [[_COMMUNITY_API Discovery|API Discovery]]
- [[_COMMUNITY_Socket.IO Protocol|Socket.IO Protocol]]
- [[_COMMUNITY_REST API (Web Clipper)|REST API (Web Clipper)]]
- [[_COMMUNITY_Board Templates|Board Templates]]
- [[_COMMUNITY_Audit Trail|Audit Trail]]
- [[_COMMUNITY_UI Workflows|UI Workflows]]
- [[_COMMUNITY_Collaboration Features|Collaboration Features]]
- [[_COMMUNITY_Element Types|Element Types]]
- [[_COMMUNITY_Canvas Positioning|Canvas Positioning]]
- [[_COMMUNITY_Creative Projects|Creative Projects]]
- [[_COMMUNITY_Organization & Planning|Organization & Planning]]
- [[_COMMUNITY_Moodboarding|Moodboarding]]
- [[_COMMUNITY_Photography Workflow|Photography Workflow]]
- [[_COMMUNITY_CDP & Auth|CDP & Auth]]
- [[_COMMUNITY_Probe & Analysis|Probe & Analysis]]
- [[_COMMUNITY_Subboard Design|Subboard Design]]
- [[_COMMUNITY_Color & Swatches|Color & Swatches]]

## God Nodes (most connected - your core abstractions)
1. `Essential Milanote Tips & Tricks Masterclass` - 21 edges
2. `Product Launch Milanote Walkthrough` - 11 edges
3. `How to Get Started with Milanote Masterclass` - 11 edges
4. `Milanote Tutorial Videos Index` - 10 edges
5. `Milanote First Look (Visual Note-Taking)` - 10 edges
6. `Photoshoot Plan template` - 8 edges
7. `Bird Photography Planning with Milanote` - 8 edges
8. `Milanote â€” Getting Started (short)` - 7 edges
9. `Plan & Design My New Home Milanote Tour` - 7 edges
10. `Element types INDEX (7 primitives + board)` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Note card primitive` --rationale_for--> `Essential Milanote Tips & Tricks Masterclass`  [INFERRED]
  knowledge/milanote/reference/videos/how-to-get-started-with-milanote-masterclass.md → knowledge/milanote/reference/videos/essential-milanote-tips-and-tricks-masterclass.md
- `Embed YouTube videos in board` --semantically_similar_to--> `Embed media (YouTube, Maps, Instagram, SoundCloud, CodePen, Slideshare, Marvel, Airtable)`  [INFERRED] [semantically similar]
  knowledge/milanote/reference/videos/getting-organized-for-my-first-product-launch-milanote-walk-through.md → knowledge/milanote/reference/videos/essential-milanote-tips-and-tricks-masterclass.md
- `Swatch cards for color palettes` --semantically_similar_to--> `Color swatch from hex value`  [INFERRED] [semantically similar]
  knowledge/milanote/reference/videos/milanote-getting-started.md → knowledge/milanote/reference/videos/essential-milanote-tips-and-tricks-masterclass.md
- `Color picker / hex code swatch` --semantically_similar_to--> `Color swatch from hex value`  [INFERRED] [semantically similar]
  knowledge/milanote/reference/videos/plan-and-design-my-new-home-milanote-tour.md → knowledge/milanote/reference/videos/essential-milanote-tips-and-tricks-masterclass.md
- `Lines pointing to favorites` --semantically_similar_to--> `Connect with lines (curved, arrow, color)`  [INFERRED] [semantically similar]
  knowledge/milanote/reference/videos/plan-and-design-my-new-home-milanote-tour.md → knowledge/milanote/reference/videos/essential-milanote-tips-and-tricks-masterclass.md

## Hyperedges (group relationships)
- **v0 supported card primitive set** — primitive_note, primitive_link, primitive_image, primitive_file, primitive_swatch, primitive_checklist, primitive_board [EXTRACTED 1.00]
- **Template pipeline (parse, resolve, depth-check)** — format_spec_top_level, format_spec_variable_substitution, format_spec_three_pass_validation, nesting_max_depth_5 [EXTRACTED 1.00]
- **Probe to reference docs to typed schemas to creator implementation loop** — discoveringapi_probe_command, elements_index, template_schema_module, audit_stubbed_components [EXTRACTED 0.95]
- **Core Milanote card primitives** — gs_note_card, gs_link_card, gs_todo_list, mgs_swatch_card, tips_image_placeholder, pl_table_card, pl_document_card [INFERRED 0.85]
- **Container/organization elements** — gs_board_container, gs_column_container, mgs_nested_boards, fl_kanban_columns, fl_unsorted_panel [INFERRED 0.85]
- **Lines and arrows for visual connections** — gs_arrow_element, tips_connect_with_lines, fl_connector_lines, hd_lines_arrows [INFERRED 0.90]
- **Photoshoot planning workflow** — ps_template_photoshoot, ps_brief_section, ps_moodboard_section, ps_shot_list, ps_call_sheet, ps_gallery, ps_workflow_checklists [EXTRACTED 1.00]
- **Idea-Rough-Polish-Finish creative pipeline** — gs_workflow_pipeline, fl_kanban_columns, fl_para_method [INFERRED 0.80]
- **Color/swatch/background features** — mgs_swatch_card, tips_color_swatch_hex, tips_board_background_color, hd_color_picker_hex [INFERRED 0.85]
- **Embeddable media sources** — tips_embed_media, pl_youtube_embed, bp_link_card_research, gs_link_card [INFERRED 0.80]
- **Collaboration capabilities** — gs_collab_invite, pl_collaborators_access, tips_create_shortcut_board, fl_shortcut_to_board [INFERRED 0.80]
- **Multi-platform Milanote apps** — pl_ipad_apple_pencil, hd_hand_draw_ipad, bp_field_notes [INFERRED 0.85]
- **Template-based starting points** — gs_template_picker, mgs_moodboard_template, ps_template_photoshoot, uc_youtube_template, bp_built_in_templates, tips_convert_to_template [INFERRED 0.90]

## Communities

### Community 0 - "Video Tutorials"
Cohesion: 0.11
Nodes (19): src/template/assets.ts AssetUploader, Architecture src/ tree, Implementation Snapshot 2026-04-29, Stubbed pending probe (ApiCreator/UiCreator/AssetUploader), What works end-to-end table, Three-pass validation (Zod, resolve, depth), MilanoteClient (src/api/client.ts), Why cap at 5 levels (UX + bug-trap) (+11 more)

### Community 1 - "Milanote Primitives"
Cohesion: 0.11
Nodes (19): Change board background color, Cmd+Return shortcut for new note, Convert board to template, Dark/light theme preference (Mac), Toggle dot grid, Double-click to create note, Image placeholder, Layer notes (bring to front / send to back) (+11 more)

### Community 2 - "API Discovery"
Cohesion: 0.15
Nodes (15): How I Use Milanote (Dan), How to Plan a Photoshoot in Milanote, Brief section, Call sheet for crew/models, Final gallery for client review, Moodboard section, Shot list, Photoshoot Plan template (+7 more)

### Community 3 - "Socket.IO Protocol"
Cohesion: 0.18
Nodes (11): Checklist for product launch tasks, Add collaborators with edit/view access, Color swatches for cohesive scheme, Document card for product details, iPad app with Apple Pencil drawing, Table for expense tracking, Text box note with color/style, Embed YouTube videos in board (+3 more)

### Community 4 - "REST API (Web Clipper)"
Cohesion: 0.2
Nodes (11): Milanote First Look (Visual Note-Taking), Draw feature for sketching/annotation, Kanban-style columns (future/upcoming/active/completed/archived), Open canvas free-form view, PARA method (Projects, Areas, Resources, Archives), Progressive summarization technique, Second Brain workspace concept, Create a shortcut for this board (+3 more)

### Community 5 - "Board Templates"
Cohesion: 0.2
Nodes (10): How to Get Started with Milanote Masterclass, Arrow design element, Board (project) container, Customizable board icon and color, Invite collaborators (edit/view/comment), Column organizational container, Note card primitive, Template picker for new boards (+2 more)

### Community 6 - "Audit Trail"
Cohesion: 0.2
Nodes (10): Connector lines between notes (arrow/dotted/normal), Hand drawing on iPad, Home master board with project columns, Lines pointing to favorites, Milanote + Notion combined workflow, Pinterest-to-Milanote image workflow, Room-by-room subboards, Plan & Design My New Home Milanote Tour (+2 more)

### Community 7 - "UI Workflows"
Cohesion: 0.22
Nodes (9): Color picker / hex code swatch, Built-in image library, Logo project example (sneaker brand), Moodboard template, Nested boards (subboards), Swatch cards for color palettes, Top-left breadcrumb navigation, Milanote â€” Getting Started (short) (+1 more)

### Community 8 - "Collaboration Features"
Cohesion: 0.25
Nodes (8): Bird Photography Planning with Milanote, 100+ built-in templates, Field notes capture (mobile + desktop sync), Link card to research webpage, Shot logistics column (location/maps/gear), Social media planning board, Target species subboard, Link card primitive

### Community 9 - "Element Types"
Cohesion: 0.4
Nodes (6): Template top-level shape ($schema, version, variables, board), Variable substitution (var, env.NAME, env.NAME?), Columnar layout (lists, headings, ordered), Default to columns rationale (deterministic, readable), Freeform canvas layout (spatial, moodboard), position {x,y} semantics

### Community 10 - "Canvas Positioning"
Cohesion: 0.4
Nodes (6): Element types INDEX (7 primitives + board), Card primitives table (type to required/optional fields), Subboard (nested board card), File primitive, Link primitive, classifySource() url vs local

### Community 11 - "Creative Projects"
Cohesion: 0.67
Nodes (4): Corpus Structure (reference + playbooks + audit), graphify build command, Milanote Brain Corpus, Post-mutation Protocol

### Community 12 - "Organization & Planning"
Cohesion: 0.67
Nodes (3): Invite editors (collaboration), Read-only share link (with comments, password), Milanote - Sharing & Collaboration (transcript)

### Community 13 - "Moodboarding"
Cohesion: 0.67
Nodes (3): ApiCreator, POST /api/elements, Primitive Nested Board Subboard

### Community 14 - "Photography Workflow"
Cohesion: 1.0
Nodes (2): Milanote Collab Socket.IO Protocol, Socket.IO v4

### Community 15 - "CDP & Auth"
Cohesion: 1.0
Nodes (2): Audit Subboard Template Redesign, Canvas Unit 7px at 100 zoom

### Community 16 - "Probe & Analysis"
Cohesion: 1.0
Nodes (1): URL-source image creation flow

### Community 17 - "Subboard Design"
Cohesion: 1.0
Nodes (1): Milanote Web Clipper (transcript unavailable)

### Community 18 - "Color & Swatches"
Cohesion: 1.0
Nodes (1): UiCreator Playwright fallback

## Knowledge Gaps
- **81 isolated node(s):** `Corpus Structure (reference + playbooks + audit)`, `position {x,y} semantics`, `Default to columns rationale (deterministic, readable)`, `429 Retry-After + 5xx 2s retry`, `Overrun symptoms (429, Cloudflare 403, 401, 5xx)` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Photography Workflow`** (2 nodes): `Milanote Collab Socket.IO Protocol`, `Socket.IO v4`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CDP & Auth`** (2 nodes): `Audit Subboard Template Redesign`, `Canvas Unit 7px at 100 zoom`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Probe & Analysis`** (1 nodes): `URL-source image creation flow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Subboard Design`** (1 nodes): `Milanote Web Clipper (transcript unavailable)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Color & Swatches`** (1 nodes): `UiCreator Playwright fallback`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Milanote Tutorial Videos Index` connect `API Discovery` to `Milanote Primitives`, `Socket.IO Protocol`, `REST API (Web Clipper)`, `Board Templates`, `Audit Trail`, `UI Workflows`, `Collaboration Features`, `Canvas Positioning`?**
  _High betweenness centrality (0.613) - this node is a cross-community bridge._
- **Why does `Element types INDEX (7 primitives + board)` connect `Canvas Positioning` to `API Discovery`?**
  _High betweenness centrality (0.295) - this node is a cross-community bridge._
- **Why does `classifySource() url vs local` connect `Canvas Positioning` to `Video Tutorials`?**
  _High betweenness centrality (0.252) - this node is a cross-community bridge._
- **What connects `Corpus Structure (reference + playbooks + audit)`, `position {x,y} semantics`, `Default to columns rationale (deterministic, readable)` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Video Tutorials` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Milanote Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._