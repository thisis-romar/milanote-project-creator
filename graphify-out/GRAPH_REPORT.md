# Graph Report - knowledge/milanote knowledge/audit  (2026-05-03)

## Corpus Check
- 9 files · ~120,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 218 nodes · 288 edges · 19 communities detected
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Milanote Core Primitives|Milanote Core Primitives]]
- [[_COMMUNITY_Collaboration & Plans|Collaboration & Plans]]
- [[_COMMUNITY_Codebase Architecture|Codebase Architecture]]
- [[_COMMUNITY_Creative Workflow Tutorials|Creative Workflow Tutorials]]
- [[_COMMUNITY_Keyboard Shortcuts & Settings|Keyboard Shortcuts & Settings]]
- [[_COMMUNITY_Visual Canvas Tools|Visual Canvas Tools]]
- [[_COMMUNITY_Motion Graphics Pre-Production|Motion Graphics Pre-Production]]
- [[_COMMUNITY_Getting Started Masterclass|Getting Started Masterclass]]
- [[_COMMUNITY_Product Launch & iPad|Product Launch & iPad]]
- [[_COMMUNITY_First Look & PARA Method|First Look & PARA Method]]
- [[_COMMUNITY_Socket.IO Collab Protocol|Socket.IO Collab Protocol]]
- [[_COMMUNITY_Template & Variable Engine|Template & Variable Engine]]
- [[_COMMUNITY_AV Rack  Nomad Project|AV Rack / Nomad Project]]
- [[_COMMUNITY_Moodboard Design Process|Moodboard Design Process]]
- [[_COMMUNITY_UIUX Design Projects|UI/UX Design Projects]]
- [[_COMMUNITY_Blog & Team Management|Blog & Team Management]]
- [[_COMMUNITY_CDP & Browser Attach|CDP & Browser Attach]]
- [[_COMMUNITY_Style Frames & Storyboards|Style Frames & Storyboards]]
- [[_COMMUNITY_Probe & Inspector|Probe & Inspector]]

## God Nodes (most connected - your core abstractions)
1. `Essential Milanote Tips & Tricks Masterclass` - 21 edges
2. `Recap: Milanote Creative Workspace (Video)` - 21 edges
3. `How To Organize Your Blog and Team With Milanote` - 18 edges
4. `How I Stay Organized With Milanote` - 17 edges
5. `Milanote Tutorial Videos Index` - 14 edges
6. `Motion Graphics Design Process How to Create a Moodboard` - 14 edges
7. `My Creative Process with Milanote UI/UX (Video)` - 14 edges
8. `Design a Visual Workspace Using Milanote` - 12 edges
9. `Product Launch Milanote Walkthrough` - 11 edges
10. `How to Get Started with Milanote Masterclass` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Note card primitive` --rationale_for--> `Essential Milanote Tips & Tricks Masterclass`  [INFERRED]
  knowledge/milanote/reference/videos/how-to-get-started-with-milanote-masterclass.md → knowledge/milanote/reference/videos/essential-milanote-tips-and-tricks-masterclass.md
- `Milanote Comments for Client Feedback` --semantically_similar_to--> `Comment (Milanote Primitive)`  [INFERRED] [semantically similar]
  knowledge/milanote/reference/videos/motion-graphics-how-to-create-style-frames.md → knowledge/milanote/reference/videos/recap-milanote-creative-workspace.md
- `Embed YouTube videos in board` --semantically_similar_to--> `Embed media (YouTube, Maps, Instagram, SoundCloud, CodePen, Slideshare, Marvel, Airtable)`  [INFERRED] [semantically similar]
  knowledge/milanote/reference/videos/getting-organized-for-my-first-product-launch-milanote-walk-through.md → knowledge/milanote/reference/videos/essential-milanote-tips-and-tricks-masterclass.md
- `Swatch cards for color palettes` --semantically_similar_to--> `Color swatch from hex value`  [INFERRED] [semantically similar]
  knowledge/milanote/reference/videos/milanote-getting-started.md → knowledge/milanote/reference/videos/essential-milanote-tips-and-tricks-masterclass.md
- `Color picker / hex code swatch` --semantically_similar_to--> `Color swatch from hex value`  [INFERRED] [semantically similar]
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

### Community 0 - "Milanote Core Primitives"
Cohesion: 0.13
Nodes (33): Board Milanote Primitive, Browser Extension Web Clipper, Infinite Canvas, Card Limit Free Plan 100 Cards, Checklist Milanote Primitive, Collaboration Board Sharing, Color Coding Cards, Column Milanote Primitive (+25 more)

### Community 1 - "Collaboration & Plans"
Cohesion: 0.11
Nodes (27): Card Limit (Free Plan), Comment (Milanote Primitive), Export to PNG/PDF/Markdown/Plain Text, Milanote Free Plan, Image (Milanote Primitive), iOS App (Coming Soon at Recap Time), Line / Connector (Milanote Primitive), Link Card (Milanote Primitive) (+19 more)

### Community 2 - "Codebase Architecture"
Cohesion: 0.09
Nodes (25): src/template/assets.ts AssetUploader, Architecture src/ tree, Implementation Snapshot 2026-04-29, Stubbed pending probe (ApiCreator/UiCreator/AssetUploader), What works end-to-end table, Three-pass validation (Zod, resolve, depth), Template top-level shape ($schema, version, variables, board), Variable substitution (var, env.NAME, env.NAME?) (+17 more)

### Community 3 - "Creative Workflow Tutorials"
Cohesion: 0.11
Nodes (21): Bird Photography Planning with Milanote, 100+ built-in templates, Field notes capture (mobile + desktop sync), Shot logistics column (location/maps/gear), Social media planning board, Target species subboard, How I Use Milanote (Dan), How to Plan a Photoshoot in Milanote (+13 more)

### Community 4 - "Keyboard Shortcuts & Settings"
Cohesion: 0.11
Nodes (19): Change board background color, Cmd+Return shortcut for new note, Convert board to template, Dark/light theme preference (Mac), Toggle dot grid, Double-click to create note, Image placeholder, Layer notes (bring to front / send to back) (+11 more)

### Community 5 - "Visual Canvas Tools"
Cohesion: 0.11
Nodes (19): Connector lines between notes (arrow/dotted/normal), Color picker / hex code swatch, Hand drawing on iPad, Home master board with project columns, Lines pointing to favorites, Milanote + Notion combined workflow, Pinterest-to-Milanote image workflow, Room-by-room subboards (+11 more)

### Community 6 - "Motion Graphics Pre-Production"
Cohesion: 0.18
Nodes (17): Animatic, Captions on Storyboard Frames, Milanote Grid Layout for Storyboards, Pre-Production Process, Rationale: Start on Paper for Storyboarding, Script (Motion Design), Storyboard, Motion Graphics: How to Create a Storyboard (Video) (+9 more)

### Community 7 - "Getting Started Masterclass"
Cohesion: 0.17
Nodes (12): Link card to research webpage, How to Get Started with Milanote Masterclass, Arrow design element, Board (project) container, Customizable board icon and color, Invite collaborators (edit/view/comment), Column organizational container, Link card primitive (+4 more)

### Community 8 - "Product Launch & iPad"
Cohesion: 0.18
Nodes (11): Checklist for product launch tasks, Add collaborators with edit/view access, Color swatches for cohesive scheme, Document card for product details, iPad app with Apple Pencil drawing, Table for expense tracking, Text box note with color/style, Embed YouTube videos in board (+3 more)

### Community 9 - "First Look & PARA Method"
Cohesion: 0.2
Nodes (11): Milanote First Look (Visual Note-Taking), Draw feature for sketching/annotation, Kanban-style columns (future/upcoming/active/completed/archived), Open canvas free-form view, PARA method (Projects, Areas, Resources, Archives), Progressive summarization technique, Second Brain workspace concept, Create a shortcut for this board (+3 more)

### Community 10 - "Socket.IO Collab Protocol"
Cohesion: 0.4
Nodes (6): Element types INDEX (7 primitives + board), Card primitives table (type to required/optional fields), Subboard (nested board card), File primitive, Link primitive, classifySource() url vs local

### Community 11 - "Template & Variable Engine"
Cohesion: 0.67
Nodes (4): Corpus Structure (reference + playbooks + audit), graphify build command, Milanote Brain Corpus, Post-mutation Protocol

### Community 12 - "AV Rack / Nomad Project"
Cohesion: 0.67
Nodes (3): Invite editors (collaboration), Read-only share link (with comments, password), Milanote - Sharing & Collaboration (transcript)

### Community 13 - "Moodboard Design Process"
Cohesion: 0.67
Nodes (3): ApiCreator, POST /api/elements, Primitive Nested Board Subboard

### Community 14 - "UI/UX Design Projects"
Cohesion: 1.0
Nodes (2): Milanote Collab Socket.IO Protocol, Socket.IO v4

### Community 15 - "Blog & Team Management"
Cohesion: 1.0
Nodes (2): Audit Subboard Template Redesign, Canvas Unit 7px at 100 zoom

### Community 16 - "CDP & Browser Attach"
Cohesion: 1.0
Nodes (1): URL-source image creation flow

### Community 17 - "Style Frames & Storyboards"
Cohesion: 1.0
Nodes (1): Milanote Web Clipper (transcript unavailable)

### Community 18 - "Probe & Inspector"
Cohesion: 1.0
Nodes (1): UiCreator Playwright fallback

## Knowledge Gaps
- **100 isolated node(s):** `Corpus Structure (reference + playbooks + audit)`, `position {x,y} semantics`, `Default to columns rationale (deterministic, readable)`, `429 Retry-After + 5xx 2s retry`, `Overrun symptoms (429, Cloudflare 403, 401, 5xx)` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `UI/UX Design Projects`** (2 nodes): `Milanote Collab Socket.IO Protocol`, `Socket.IO v4`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Blog & Team Management`** (2 nodes): `Audit Subboard Template Redesign`, `Canvas Unit 7px at 100 zoom`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CDP & Browser Attach`** (1 nodes): `URL-source image creation flow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Style Frames & Storyboards`** (1 nodes): `Milanote Web Clipper (transcript unavailable)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Probe & Inspector`** (1 nodes): `UiCreator Playwright fallback`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Milanote Tutorial Videos Index` connect `Creative Workflow Tutorials` to `Milanote Core Primitives`, `Keyboard Shortcuts & Settings`, `Visual Canvas Tools`, `Getting Started Masterclass`, `Product Launch & iPad`, `First Look & PARA Method`, `Socket.IO Collab Protocol`?**
  _High betweenness centrality (0.428) - this node is a cross-community bridge._
- **Why does `Element types INDEX (7 primitives + board)` connect `Socket.IO Collab Protocol` to `Creative Workflow Tutorials`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Why does `classifySource() url vs local` connect `Socket.IO Collab Protocol` to `Codebase Architecture`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `How I Stay Organized With Milanote` (e.g. with `Design a Visual Workspace Using Milanote` and `How To Organize Your Blog and Team With Milanote`) actually correct?**
  _`How I Stay Organized With Milanote` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Corpus Structure (reference + playbooks + audit)`, `position {x,y} semantics`, `Default to columns rationale (deterministic, readable)` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Milanote Core Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Collaboration & Plans` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._