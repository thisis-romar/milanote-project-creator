# Graph Report - knowledge/milanote  (2026-05-03)

## Corpus Check
- 202 files · ~50,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 470 nodes · 1008 edges · 15 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 173 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Milanote BOARD Element Type|Milanote BOARD Element Type]]
- [[_COMMUNITY_Milanote Official Template Catalog (206|Milanote Official Template Catalog (206 ]]
- [[_COMMUNITY_Milanote BOARD Element Type|Milanote BOARD Element Type]]
- [[_COMMUNITY_Milanote Board Primitive|Milanote Board Primitive]]
- [[_COMMUNITY_Moodboard Use Case|Moodboard Use Case]]
- [[_COMMUNITY_Milanote BOARD Element Type|Milanote BOARD Element Type]]
- [[_COMMUNITY_Milanote BOARD Element Type|Milanote BOARD Element Type]]
- [[_COMMUNITY_Milanote Template|Milanote Template]]
- [[_COMMUNITY_Recap Milanote Creative Workspace (Vide|Recap: Milanote Creative Workspace (Vide]]
- [[_COMMUNITY_Template top-level shape ($schema, versi|Template top-level shape ($schema, versi]]
- [[_COMMUNITY_Motion Graphics How to Create Style Fra|Motion Graphics: How to Create Style Fra]]
- [[_COMMUNITY_Milanote Brain Corpus|Milanote Brain Corpus]]
- [[_COMMUNITY_Milanote - Sharing & Collaboration (tran|Milanote - Sharing & Collaboration (tran]]
- [[_COMMUNITY_URL-source image creation flow|URL-source image creation flow]]
- [[_COMMUNITY_Milanote Web Clipper (transcript unavail|Milanote Web Clipper (transcript unavail]]

## God Nodes (most connected - your core abstractions)
1. `Milanote BOARD Element Type` - 72 edges
2. `Milanote SKELETON Element Type` - 72 edges
3. `Milanote Template` - 25 edges
4. `Milanote BOARD Element Type` - 25 edges
5. `Milanote SKELETON Element Type` - 25 edges
6. `Recap: Milanote Creative Workspace (Video)` - 21 edges
7. `Moodboard Use Case` - 19 edges
8. `Milanote Template` - 18 edges
9. `Milanote SKELETON Element Type` - 18 edges
10. `Milanote BOARD Element Type` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Moodboard Template` --semantically_similar_to--> `Moodboard Use Case`  [INFERRED] [semantically similar]
  knowledge/milanote/reference/templates/featured/moodboard.md → knowledge/milanote/reference/videos/how-i-use-milanote.md
- `Milanote Comments for Client Feedback` --semantically_similar_to--> `Comment (Milanote Primitive)`  [INFERRED] [semantically similar]
  knowledge/milanote/reference/videos/motion-graphics-how-to-create-style-frames.md → knowledge/milanote/reference/videos/recap-milanote-creative-workspace.md
- `Template: Campaign Brief (Agencies)` --conceptually_related_to--> `Primitive: Board (top-level container)`  [INFERRED]
  knowledge/milanote/reference/templates/agencies/digital-campaign-brief.md → knowledge/milanote/reference/concepts/intro-video-2026-04-29.md
- `Template: Craft Project Plan (Craft & Makers)` --conceptually_related_to--> `Primitive: Board (top-level container)`  [INFERRED]
  knowledge/milanote/reference/templates/craft-makers/craft-project-plan.md → knowledge/milanote/reference/concepts/intro-video-2026-04-29.md
- `Template: Moodboard / Design Exploration (Creative Direction)` --conceptually_related_to--> `Primitive: Board (top-level container)`  [INFERRED]
  knowledge/milanote/reference/templates/creative-direction/design-exploration.md → knowledge/milanote/reference/concepts/intro-video-2026-04-29.md

## Hyperedges (group relationships)
- **v0 supported card primitive set** — primitive_note, primitive_link, primitive_image, primitive_file, primitive_swatch, primitive_checklist, primitive_board [EXTRACTED 1.00]
- **Template pipeline (parse, resolve, depth-check)** — format_spec_top_level, format_spec_variable_substitution, format_spec_three_pass_validation, nesting_max_depth_5 [EXTRACTED 1.00]
- **Brand Strategy Template Suite** — template_brand_strategy, template_brand_audit, template_brand_naming, template_brand_personality [INFERRED 0.85]
- **YouTube Content Creation Template Suite** — template_youtube_video_brainstorm, template_youtube_video_research, template_youtube_script, template_youtube_equipment_checklist [INFERRED 0.85]
- **Craft Project Template Suite** — template_craft_project_brainstorm, template_craft_project_moodboard, template_craft_materials_list, template_craft_project_timeline [INFERRED 0.85]
- **Film Production Template Suite** — template_film_brainstorm, template_beat_sheet, template_filmmaking_storyboard, template_film_shot_list, template_call_sheet, template_pre_production [INFERRED 0.85]
- **Cross-domain Moodboard Templates** — template_architecture_moodboard, template_fashion_moodboard, template_craft_project_moodboard [INFERRED 0.80]
- **Cross-domain Brainstorm Templates** — template_youtube_video_brainstorm, template_craft_project_brainstorm, template_fashion_brainstorm, template_film_brainstorm [INFERRED 0.80]
- **Cross-domain Storyboard Templates** — template_filmmaking_storyboard, template_tvc_storyboard [INFERRED 0.85]
- **All Templates Share BOARD+SKELETON Element Schema** — template_architecture_moodboard, template_brand_audit, template_brand_naming, template_brand_personality, template_brand_strategy, template_youtube_equipment_checklist, template_youtube_script, template_youtube_video_brainstorm, template_youtube_video_research, template_craft_materials_list, template_craft_project_brainstorm, template_craft_project_moodboard, template_craft_project_timeline, template_advertising_brief, template_tvc_storyboard, template_fashion_brainstorm, template_fashion_lookbook, template_fashion_moodboard, template_beat_sheet, template_call_sheet, template_film_brainstorm, template_film_shot_list, template_filmmaking_storyboard, template_pre_production, template_character_profile_game [EXTRACTED 1.00]
- **Game Design Templates** — game_design_mechanics, game_design_moodboard, game_design_story_outline, game_design_storyboard, game_world_building, rpg_dungeon_map [EXTRACTED 1.00]
- **Logo Design Templates** — logo_brainstorm, logo_creative_brief, logo_moodboard, logo_design_presentation, logo_assets_handover [EXTRACTED 1.00]
- **Marketing Templates** — marketing_campaign_moodboard, marketing_content_plan, campaign_reports, brand_positioning_map, brand_swot_analysis, empathy_map [INFERRED 0.80]
- **Storyboard Templates Across Categories** — game_design_storyboard, video_storyboard, fashion_storyboard [INFERRED 0.90]
- **Moodboard Templates Across Categories** — game_design_moodboard, wedding_moodboard, logo_moodboard, marketing_campaign_moodboard [INFERRED 0.90]
- **Design Brief Templates Across Categories** — graphic_design_brief, illustration_design_brief, interior_design_brief, logo_creative_brief [INFERRED 0.85]
- **Standard BOARD+SKELETON Element Pattern** — element_type_board, element_type_skeleton, game_design_mechanics, game_design_moodboard, game_design_story_outline, game_design_storyboard, game_world_building, rpg_dungeon_map, graphic_design_brief, video_storyboard, illustration_design_brief, interior_design_brief, interior_design_product_list, fashion_storyboard, vision_board, wedding_moodboard, logo_brainstorm, logo_assets_handover, logo_creative_brief, logo_design_presentation, logo_moodboard, brand_swot_analysis, empathy_map, campaign_reports, marketing_campaign_moodboard, marketing_content_plan, brand_positioning_map [EXTRACTED 1.00]
- **Moodboarding Templates Group** — fashion-moodboard-template_template, filmmaking-moodboard_template, graphic-design-moodboard-template_template, illustrative-moodboard_template, poster-moodboard_template, category_moodboarding [EXTRACTED 1.00]
- **Motion Design Templates Group** — motion-design-brainstorm-template_template, motion-design-brief_template, motion-design-moodboard_template, motion-design-storyboard_template, style-frames_template, category_motion_design [EXTRACTED 1.00]
- **Photography Templates Group** — model-brief_template, photography-contact-sheet_template, shot-list_template, category_photography [EXTRACTED 1.00]
- **Podcasting Templates Group** — podcast-outline-template_template, podcast-research_template, podcast-script_template, category_podcasting [EXTRACTED 1.00]
- **Renovation and DIY Templates Group** — renovation-design-brief_template, renovation-material-list_template, renovation-moodboard_template, category_renovation_diy [EXTRACTED 1.00]
- **Common Template Element Types BOARD and SKELETON** — element_type_board, element_type_skeleton, market-research_template, fashion-moodboard-template_template, filmmaking-moodboard_template, graphic-design-moodboard-template_template, illustrative-moodboard_template, poster-moodboard_template, motion-design-brainstorm-template_template, motion-design-brief_template, motion-design-moodboard_template, motion-design-storyboard_template, style-frames_template, model-brief_template, photography-contact-sheet_template, shot-list_template, podcast-outline-template_template, podcast-research_template, podcast-script_template, customer-journey-map-template_template, inspiration-board-template_template, team-planner-template_template, renovation-design-brief_template, renovation-material-list_template, renovation-moodboard_template, project-retrospective-template_template, lean-canvas-template_template [EXTRACTED 1.00]
- **UX/UI/Product Design Templates** — brand-assets-template_brand_assets, interface-sketches-template_interface_sketches, user-interview-notes-template_user_interview_notes, user-journey-map-template_user_journey_map, ux-storyboard_ux_storyboard, website-competitor-analysis_website_competitor_analysis [EXTRACTED 1.00]
- **Visual Art Templates** — visual-art-brainstorm_art_brainstorm, visual-art-brief_art_brief, visual-art-moodboard_art_moodboard, visual-art-research_art_research [EXTRACTED 1.00]
- **Website Design Templates** — persona-template_customer_persona, user-flow-template_user_flow_diagram, website-content-template_content_plan, website-ideas-template_website_brainstorm [EXTRACTED 1.00]
- **Writing Templates** — character-profile-template_character_profile, novel-moodboard_novel_moodboard, novel-research_research, story-brainstorm_story_brainstorm, story-map_story_map, story-outline-template_story_outline, three-act-structure-outline_three_act_structure [EXTRACTED 1.00]
- **Narrative Structure Templates** — story-outline-template_story_outline, three-act-structure-outline_three_act_structure, story-map_story_map [INFERRED 0.80]
- **UX Research Templates** — user-interview-notes-template_user_interview_notes, user-journey-map-template_user_journey_map, persona-template_customer_persona, target-audience-template_target_audience [INFERRED 0.80]

## Communities

### Community 0 - "Milanote BOARD Element Type"
Cohesion: 0.07
Nodes (82): Brand Assets Template, Brand Positioning Map Template, Brand SWOT Analysis Template, Game Design Category, Graphic Design Category, Illustration Category, Interior Design Category, Lifestyle and Personal Category (+74 more)

### Community 1 - "Milanote Official Template Catalog (206 "
Cohesion: 0.06
Nodes (55): Bulk Element Create via REST, Candidate Mutations (POST/PUT/PATCH 2xx), CDP Attach to Edge Browser, Client-Generated Element ID, CollabSocket Class (Required for ApiCreator), ELEMENT_CREATE WebSocket Action, ELEMENT_TYPES Enum (LINK, CARD, IMAGE, BOARD, COLUMN, LINE), environmentFolder 'p' (S3 production folder prefix) (+47 more)

### Community 2 - "Milanote BOARD Element Type"
Cohesion: 0.07
Nodes (51): Milanote Board 1Is9WC2poehl9K (Team Structure), Milanote Board 1ItZNa2u4Aa3le (Illustration Project Plan), Milanote Board 1IwUcd2DP5Ys96 (Competitor Landscape), Milanote Board 1IxDPl2DP5Z5eg (RPG Campaign Map), Milanote Board 1MPm641PG9On9D (Design Agency Hub), Milanote Board 1MPmsR1S2NVk3q (Game Design Document), Milanote Board 1MPmyl1PG9Ps4p (Design Project Plan), Milanote Board 1MdFVa1Mc2ar4z (Game Level Design) (+43 more)

### Community 3 - "Milanote Board Primitive"
Cohesion: 0.08
Nodes (47): 2026-05-02 Automated Probe Session, Initial API Probe — 2026-04-29, Character Relationship Map Template, Milanote Board Primitive, Milanote Checklist/Task List Primitive, Collaboration Board Sharing, Color Swatch Card, Milanote Column Primitive (+39 more)

### Community 4 - "Moodboard Use Case"
Cohesion: 0.09
Nodes (43): src/template/assets.ts AssetUploader, Nomad AV Rack Template — Subboard-per-Conversation Redesign, Board Milanote Primitive, Browser Extension Web Clipper, Infinite Canvas, Canvas Coordinate System (1 unit ≈ 7px), Card Limit Free Plan 100 Cards, Checklist Milanote Primitive (+35 more)

### Community 5 - "Milanote BOARD Element Type"
Cohesion: 0.09
Nodes (41): Metrics Analysis Board ID 1Irp4l2poegR4Z, Metrics Analysis (AARR) Template, Project Plan Board ID 1Iv6ac2xwqoydD, Academic Project Plan Template, Agile Task Board Board ID 1MPlCY1S2NpUyv, Agile Task Board Template, Brainstorming Board ID 1IrpyI2poegP2t, Brainstorming Template (+33 more)

### Community 6 - "Milanote BOARD Element Type"
Cohesion: 0.18
Nodes (39): Architecture Category, Brand Strategy Category, Content Creation Category, Craft and Makers Category, Creative Direction Category, Fashion Design Category, Film TV Category, Brainstorm (Ideation Concept) (+31 more)

### Community 7 - "Milanote Template"
Cohesion: 0.12
Nodes (35): Board Element Type, Campaign Reports Template, Campaign Strategy, Marketing Campaign Category, Photography Category, Podcasting Category, Product Management Category, Customer Journey Map Template (+27 more)

### Community 8 - "Recap: Milanote Creative Workspace (Vide"
Cohesion: 0.11
Nodes (27): Card Limit (Free Plan), Comment (Milanote Primitive), Export to PNG/PDF/Markdown/Plain Text, Milanote Free Plan, Image (Milanote Primitive), iOS App (Coming Soon at Recap Time), Line / Connector (Milanote Primitive), Link Card (Milanote Primitive) (+19 more)

### Community 9 - "Template top-level shape ($schema, versi"
Cohesion: 0.09
Nodes (24): Architecture src/ tree, Implementation Snapshot 2026-04-29, Stubbed pending probe (ApiCreator/UiCreator/AssetUploader), What works end-to-end table, Three-pass validation (Zod, resolve, depth), Template top-level shape ($schema, version, variables, board), Variable substitution (var, env.NAME, env.NAME?), Columnar layout (lists, headings, ordered) (+16 more)

### Community 10 - "Motion Graphics: How to Create Style Fra"
Cohesion: 0.18
Nodes (17): Animatic, Captions on Storyboard Frames, Milanote Grid Layout for Storyboards, Pre-Production Process, Rationale: Start on Paper for Storyboarding, Script (Motion Design), Storyboard, Motion Graphics: How to Create a Storyboard (Video) (+9 more)

### Community 11 - "Milanote Brain Corpus"
Cohesion: 0.67
Nodes (4): Corpus Structure (reference + playbooks + audit), graphify build command, Milanote Brain Corpus, Post-mutation Protocol

### Community 12 - "Milanote - Sharing & Collaboration (tran"
Cohesion: 0.67
Nodes (3): Invite editors (collaboration), Read-only share link (with comments, password), Milanote - Sharing & Collaboration (transcript)

### Community 13 - "URL-source image creation flow"
Cohesion: 1.0
Nodes (1): URL-source image creation flow

### Community 14 - "Milanote Web Clipper (transcript unavail"
Cohesion: 1.0
Nodes (1): Milanote Web Clipper (transcript unavailable)

## Knowledge Gaps
- **112 isolated node(s):** `Corpus Structure (reference + playbooks + audit)`, `position {x,y} semantics`, `Default to columns rationale (deterministic, readable)`, `429 Retry-After + 5xx 2s retry`, `Overrun symptoms (429, Cloudflare 403, 401, 5xx)` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `URL-source image creation flow`** (1 nodes): `URL-source image creation flow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Milanote Web Clipper (transcript unavail`** (1 nodes): `Milanote Web Clipper (transcript unavailable)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Moodboard Use Case` connect `Moodboard Use Case` to `Milanote BOARD Element Type`, `Milanote BOARD Element Type`, `Milanote Board Primitive`, `Milanote BOARD Element Type`, `Milanote Template`?**
  _High betweenness centrality (0.509) - this node is a cross-community bridge._
- **Why does `Milanote BOARD Element Type` connect `Milanote BOARD Element Type` to `Milanote Template`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Why does `Milanote SKELETON Element Type` connect `Milanote BOARD Element Type` to `Milanote Template`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **What connects `Corpus Structure (reference + playbooks + audit)`, `position {x,y} semantics`, `Default to columns rationale (deterministic, readable)` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Milanote BOARD Element Type` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Milanote Official Template Catalog (206 ` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Milanote BOARD Element Type` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._