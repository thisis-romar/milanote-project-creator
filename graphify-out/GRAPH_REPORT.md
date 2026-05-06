# Graph Report - .  (2026-05-06)

## Corpus Check
- 234 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 593 nodes · 1147 edges · 24 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 184 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Template Catalog and Categories|Template Catalog and Categories]]
- [[_COMMUNITY_HTTP Client and CDP Auth|HTTP Client and CDP Auth]]
- [[_COMMUNITY_Project Architecture and Docs|Project Architecture and Docs]]
- [[_COMMUNITY_Milanote Primitives|Milanote Primitives]]
- [[_COMMUNITY_Project Management Templates|Project Management Templates]]
- [[_COMMUNITY_Creative Design Categories|Creative Design Categories]]
- [[_COMMUNITY_Board and Canvas Features|Board and Canvas Features]]
- [[_COMMUNITY_Template Parser and Planner|Template Parser and Planner]]
- [[_COMMUNITY_Marketing and Campaign Templates|Marketing and Campaign Templates]]
- [[_COMMUNITY_CDP Probe Scripts|CDP Probe Scripts]]
- [[_COMMUNITY_Socket.IO Collab Channel|Socket.IO Collab Channel]]
- [[_COMMUNITY_UI Probe Harness|UI Probe Harness]]
- [[_COMMUNITY_Template API and Discovery|Template API and Discovery]]
- [[_COMMUNITY_Project Plan Board IDs|Project Plan Board IDs]]
- [[_COMMUNITY_UI Creator|UI Creator]]
- [[_COMMUNITY_Writing and Web Templates|Writing and Web Templates]]
- [[_COMMUNITY_Game Design Templates|Game Design Templates]]
- [[_COMMUNITY_Campaign and Film Marketing|Campaign and Film Marketing]]
- [[_COMMUNITY_Template Structure Fetch Script|Template Structure Fetch Script]]
- [[_COMMUNITY_Asset Classifier|Asset Classifier]]
- [[_COMMUNITY_Weekly Plan Template|Weekly Plan Template]]
- [[_COMMUNITY_Design Agency Hub Template|Design Agency Hub Template]]
- [[_COMMUNITY_Competitor Landscape Template|Competitor Landscape Template]]
- [[_COMMUNITY_Team Structure Template|Team Structure Template]]

## God Nodes (most connected - your core abstractions)
1. `Milanote BOARD Element Type` - 72 edges
2. `Milanote SKELETON Element Type` - 72 edges
3. `Milanote Template` - 25 edges
4. `Milanote BOARD Element Type` - 25 edges
5. `Milanote SKELETON Element Type` - 25 edges
6. `milanote-project-creator (CLAUDE.md)` - 23 edges
7. `Recap: Milanote Creative Workspace (Video)` - 21 edges
8. `Milanote Template` - 18 edges
9. `Milanote SKELETON Element Type` - 18 edges
10. `Milanote BOARD Element Type` - 18 edges

## Surprising Connections (you probably didn't know these)
- `parseAction()` --calls--> `parse()`  [INFERRED]
  C:\Users\romar\projects\milanote-project-creator\scripts\capture-template-content.mjs → C:\Users\romar\projects\milanote-project-creator\src\commands\validate.test.ts
- `printPlan()` --calls--> `log()`  [INFERRED]
  C:\Users\romar\projects\milanote-project-creator\src\creator\plan.ts → C:\Users\romar\projects\milanote-project-creator\scripts\drive-probe-actions.mjs
- `main()` --calls--> `getOrOpenMilanotePage()`  [INFERRED]
  C:\Users\romar\projects\milanote-project-creator\scripts\drive-probe-actions.mjs → C:\Users\romar\projects\milanote-project-creator\src\cdp\page.ts
- `readFrames()` --calls--> `parse()`  [INFERRED]
  C:\Users\romar\projects\milanote-project-creator\scripts\capture-template-content.mjs → C:\Users\romar\projects\milanote-project-creator\src\commands\validate.test.ts
- `saveWorkspaceSnapshot()` --calls--> `log()`  [INFERRED]
  C:\Users\romar\projects\milanote-project-creator\src\api\inspector.ts → C:\Users\romar\projects\milanote-project-creator\scripts\drive-probe-actions.mjs

## Hyperedges (group relationships)
- **Cross-domain Moodboard Templates** — template_architecture_moodboard, template_fashion_moodboard, template_craft_project_moodboard [INFERRED 0.80]
- **All Templates Share BOARD+SKELETON Element Schema** — template_architecture_moodboard, template_brand_audit, template_brand_naming, template_brand_personality, template_brand_strategy, template_youtube_equipment_checklist, template_youtube_script, template_youtube_video_brainstorm, template_youtube_video_research, template_craft_materials_list, template_craft_project_brainstorm, template_craft_project_moodboard, template_craft_project_timeline, template_advertising_brief, template_tvc_storyboard, template_fashion_brainstorm, template_fashion_lookbook, template_fashion_moodboard, template_beat_sheet, template_call_sheet, template_film_brainstorm, template_film_shot_list, template_filmmaking_storyboard, template_pre_production, template_character_profile_game [EXTRACTED 1.00]
- **Brand Strategy Template Suite** — template_brand_strategy, template_brand_audit, template_brand_naming, template_brand_personality [INFERRED 0.85]
- **YouTube Content Creation Template Suite** — template_youtube_video_brainstorm, template_youtube_video_research, template_youtube_script, template_youtube_equipment_checklist [INFERRED 0.85]
- **Craft Project Template Suite** — template_craft_project_brainstorm, template_craft_project_moodboard, template_craft_materials_list, template_craft_project_timeline [INFERRED 0.85]
- **Cross-domain Brainstorm Templates** — template_youtube_video_brainstorm, template_craft_project_brainstorm, template_fashion_brainstorm, template_film_brainstorm [INFERRED 0.80]
- **Cross-domain Storyboard Templates** — template_filmmaking_storyboard, template_tvc_storyboard [INFERRED 0.85]
- **Film Production Template Suite** — template_film_brainstorm, template_beat_sheet, template_filmmaking_storyboard, template_film_shot_list, template_call_sheet, template_pre_production [INFERRED 0.85]
- **Game Design Templates** — game_design_mechanics, game_design_moodboard, game_design_story_outline, game_design_storyboard, game_world_building, rpg_dungeon_map [EXTRACTED 1.00]
- **Standard BOARD+SKELETON Element Pattern** — element_type_board, element_type_skeleton, game_design_mechanics, game_design_moodboard, game_design_story_outline, game_design_storyboard, game_world_building, rpg_dungeon_map, graphic_design_brief, video_storyboard, illustration_design_brief, interior_design_brief, interior_design_product_list, fashion_storyboard, vision_board, wedding_moodboard, logo_brainstorm, logo_assets_handover, logo_creative_brief, logo_design_presentation, logo_moodboard, brand_swot_analysis, empathy_map, campaign_reports, marketing_campaign_moodboard, marketing_content_plan, brand_positioning_map [EXTRACTED 1.00]
- **Moodboard Templates Across Categories** — game_design_moodboard, wedding_moodboard, logo_moodboard, marketing_campaign_moodboard [INFERRED 0.90]
- **Storyboard Templates Across Categories** — game_design_storyboard, video_storyboard, fashion_storyboard [INFERRED 0.90]
- **Design Brief Templates Across Categories** — graphic_design_brief, illustration_design_brief, interior_design_brief, logo_creative_brief [INFERRED 0.85]
- **Logo Design Templates** — logo_brainstorm, logo_creative_brief, logo_moodboard, logo_design_presentation, logo_assets_handover [EXTRACTED 1.00]
- **Marketing Templates** — marketing_campaign_moodboard, marketing_content_plan, campaign_reports, brand_positioning_map, brand_swot_analysis, empathy_map [INFERRED 0.80]
- **Common Template Element Types BOARD and SKELETON** — element_type_board, element_type_skeleton, market-research_template, fashion-moodboard-template_template, filmmaking-moodboard_template, graphic-design-moodboard-template_template, illustrative-moodboard_template, poster-moodboard_template, motion-design-brainstorm-template_template, motion-design-brief_template, motion-design-moodboard_template, motion-design-storyboard_template, style-frames_template, model-brief_template, photography-contact-sheet_template, shot-list_template, podcast-outline-template_template, podcast-research_template, podcast-script_template, customer-journey-map-template_template, inspiration-board-template_template, team-planner-template_template, renovation-design-brief_template, renovation-material-list_template, renovation-moodboard_template, project-retrospective-template_template, lean-canvas-template_template [EXTRACTED 1.00]
- **Moodboarding Templates Group** — fashion-moodboard-template_template, filmmaking-moodboard_template, graphic-design-moodboard-template_template, illustrative-moodboard_template, poster-moodboard_template, category_moodboarding [EXTRACTED 1.00]
- **Motion Design Templates Group** — motion-design-brainstorm-template_template, motion-design-brief_template, motion-design-moodboard_template, motion-design-storyboard_template, style-frames_template, category_motion_design [EXTRACTED 1.00]
- **Photography Templates Group** — model-brief_template, photography-contact-sheet_template, shot-list_template, category_photography [EXTRACTED 1.00]
- **Podcasting Templates Group** — podcast-outline-template_template, podcast-research_template, podcast-script_template, category_podcasting [EXTRACTED 1.00]
- **Renovation and DIY Templates Group** — renovation-design-brief_template, renovation-material-list_template, renovation-moodboard_template, category_renovation_diy [EXTRACTED 1.00]
- **UX/UI/Product Design Templates** — brand-assets-template_brand_assets, interface-sketches-template_interface_sketches, user-interview-notes-template_user_interview_notes, user-journey-map-template_user_journey_map, ux-storyboard_ux_storyboard, website-competitor-analysis_website_competitor_analysis [EXTRACTED 1.00]
- **UX Research Templates** — user-interview-notes-template_user_interview_notes, user-journey-map-template_user_journey_map, persona-template_customer_persona, target-audience-template_target_audience [INFERRED 0.80]
- **Visual Art Templates** — visual-art-brainstorm_art_brainstorm, visual-art-brief_art_brief, visual-art-moodboard_art_moodboard, visual-art-research_art_research [EXTRACTED 1.00]
- **Website Design Templates** — persona-template_customer_persona, user-flow-template_user_flow_diagram, website-content-template_content_plan, website-ideas-template_website_brainstorm [EXTRACTED 1.00]
- **Writing Templates** — character-profile-template_character_profile, novel-moodboard_novel_moodboard, novel-research_research, story-brainstorm_story_brainstorm, story-map_story_map, story-outline-template_story_outline, three-act-structure-outline_three_act_structure [EXTRACTED 1.00]
- **Narrative Structure Templates** — story-outline-template_story_outline, three-act-structure-outline_three_act_structure, story-map_story_map [INFERRED 0.80]

## Communities

### Community 0 - "Template Catalog and Categories"
Cohesion: 0.07
Nodes (82): Brand Assets Template, Brand Positioning Map Template, Brand SWOT Analysis Template, Game Design Category, Graphic Design Category, Illustration Category, Interior Design Category, Lifestyle and Personal Category (+74 more)

### Community 1 - "HTTP Client and CDP Auth"
Cohesion: 0.06
Nodes (13): attachToEdge(), MilanoteClient, TokenBucket, delay(), getEdgePath(), httpGet(), launchEdgeWithCDP(), waitForCDP() (+5 more)

### Community 2 - "Project Architecture and Docs"
Cohesion: 0.06
Nodes (50): src/api/inspector.ts â€” XHR Probe, API Module (src/api/), src/api/probe.ts â€” Endpoint Discovery, Rationale: CDP Auth â€” No Session File, CDP Module (src/cdp/), .github/workflows/ci.yml â€” CI Workflow, src/api/collab-socket.ts â€” Socket.IO v4 Client, Commands Module (src/commands/) (+42 more)

### Community 3 - "Milanote Primitives"
Cohesion: 0.07
Nodes (44): Card Limit (Free Plan), Comment (Milanote Primitive), Export to PNG/PDF/Markdown/Plain Text, Milanote Free Plan, Image (Milanote Primitive), iOS App (Coming Soon at Recap Time), Line / Connector (Milanote Primitive), Link Card (Milanote Primitive) (+36 more)

### Community 4 - "Project Management Templates"
Cohesion: 0.09
Nodes (42): Metrics Analysis Board ID 1Irp4l2poegR4Z, Metrics Analysis (AARR) Template, Project Plan Board ID 1Iv6ac2xwqoydD, Academic Project Plan Template, Agile Task Board Board ID 1MPlCY1S2NpUyv, Agile Task Board Template, Brainstorming Board ID 1IrpyI2poegP2t, Brainstorming Template (+34 more)

### Community 5 - "Creative Design Categories"
Cohesion: 0.18
Nodes (39): Architecture Category, Brand Strategy Category, Content Creation Category, Craft and Makers Category, Creative Direction Category, Fashion Design Category, Film TV Category, Brainstorm (Ideation Concept) (+31 more)

### Community 6 - "Board and Canvas Features"
Cohesion: 0.11
Nodes (37): Milanote Board 1UIJTu1R8ZN95Z (Moodboard), Milanote Board 1UIKIA15r3jBAm (Creative Brief), Board Milanote Primitive, Browser Extension Web Clipper, Infinite Canvas, Card Limit Free Plan 100 Cards, Checklist Milanote Primitive, Collaboration Board Sharing (+29 more)

### Community 7 - "Template Parser and Planner"
Cohesion: 0.09
Nodes (12): parseTemplate(), TemplateParseError, cardTitle(), printPlan(), truncate(), checkBoardDepth(), parse(), lookup() (+4 more)

### Community 8 - "Marketing and Campaign Templates"
Cohesion: 0.12
Nodes (34): Board Element Type, Campaign Reports Template, Campaign Strategy, Marketing Campaign Category, Photography Category, Podcasting Category, Product Management Category, Interior Design Moodboard (+26 more)

### Community 9 - "CDP Probe Scripts"
Cohesion: 0.08
Nodes (15): clickBack(), clickTemplateInPane(), delay(), getNewBoardId(), makeCdp(), getPickerState(), makeCdp(), buildMarkdown() (+7 more)

### Community 10 - "Socket.IO Collab Channel"
Cohesion: 0.16
Nodes (4): buildCookieHeader(), getMilanoteCookies(), CollabSocket, ApiCreator

### Community 11 - "UI Probe Harness"
Cohesion: 0.14
Nodes (16): attempt(), getClientConf(), log(), main(), takeDomSnapshot(), ts(), waitForSelectorSafe(), delay() (+8 more)

### Community 12 - "Template API and Discovery"
Cohesion: 0.18
Nodes (15): GET /api/boards?ids= (Template Fetch Endpoint), Templates Are Regular Milanote Boards, TemplatePicker React Component (CDP Extraction), Milanote Official Template Catalog (206 templates, 31 categories), Template: Design Concept (Architecture), Template: Architectural Project Plan (Architecture), Template: Craft Project Plan (Craft & Makers), Template: Moodboard / Design Exploration (Creative Direction) (+7 more)

### Community 13 - "Project Plan Board IDs"
Cohesion: 0.2
Nodes (10): Milanote Board 1ItZNa2u4Aa3le (Illustration Project Plan), Milanote Board 1MPmyl1PG9Ps4p (Design Project Plan), Milanote Board 1NNRSO1KQbpieU (Logo Project Plan), Milanote Board 1R372p1utOO2f0 (Interior Design Project Plan), Milanote Board 1UIKbq1R90VFch (Project Plan), Project Plan Template (Featured), Design Project Plan Template, Illustration Project Plan Template (+2 more)

### Community 14 - "UI Creator"
Cohesion: 0.56
Nodes (1): UiCreator

### Community 15 - "Writing and Web Templates"
Cohesion: 0.44
Nodes (9): Character Relationship Map Template, SKELETON Element Type, Website Design Category, Writing Category, Novel Marketing Plan Template, Novel Plan Template, Website Brief Template, Website Project Plan Template (+1 more)

### Community 16 - "Game Design Templates"
Cohesion: 0.25
Nodes (8): Milanote Board 1IxDPl2DP5Z5eg (RPG Campaign Map), Milanote Board 1MPmsR1S2NVk3q (Game Design Document), Milanote Board 1MdFVa1Mc2ar4z (Game Level Design), Milanote Board 1MlgiI1SecPsxU (Game Flow Diagram), Game Design Document Template, Game Flow Diagram Template, Game Level Design Template, RPG Campaign Map Template

### Community 17 - "Campaign and Film Marketing"
Cohesion: 0.33
Nodes (6): Milanote Board 1SM4N31PkN7d49 (Campaign Plan), Milanote Board 1THFHo1gnesk7D (Film Marketing Plan), Milanote Board 1TgsS41fa1CIch (Game Marketing Plan), Film Marketing Plan Template, Game Marketing Plan Template, Campaign Plan Template

### Community 19 - "Template Structure Fetch Script"
Cohesion: 0.6
Nodes (3): delay(), fetchBoard(), fetchSubboard()

### Community 21 - "Asset Classifier"
Cohesion: 1.0
Nodes (2): assertLocalExists(), classifySource()

### Community 25 - "Weekly Plan Template"
Cohesion: 1.0
Nodes (2): Milanote Board 1UIKgx15r3G04M (Weekly Plan), Weekly Plan Template

### Community 26 - "Design Agency Hub Template"
Cohesion: 1.0
Nodes (2): Milanote Board 1MPm641PG9On9D (Design Agency Hub), Design Agency Hub Template

### Community 27 - "Competitor Landscape Template"
Cohesion: 1.0
Nodes (2): Milanote Board 1IwUcd2DP5Ys96 (Competitor Landscape), Competitor Landscape Template

### Community 28 - "Team Structure Template"
Cohesion: 1.0
Nodes (2): Milanote Board 1Is9WC2poehl9K (Team Structure), Team Structure Template

## Knowledge Gaps
- **91 isolated node(s):** `TemplatePicker React Component (CDP Extraction)`, `Template: Campaign Brief (Agencies)`, `Architecture Category`, `Template: Craft Project Plan (Craft & Makers)`, `Timeline (Project Planning Concept)` (+86 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `UI Creator`** (9 nodes): `UiCreator`, `.constructor()`, `.createCard()`, `.createColumn()`, `.createRootBoard()`, `.createSubboard()`, `.dragTool()`, `.lastElementId()`, `.tryFill()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Asset Classifier`** (3 nodes): `assertLocalExists()`, `classifySource()`, `assets.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Weekly Plan Template`** (2 nodes): `Milanote Board 1UIKgx15r3G04M (Weekly Plan)`, `Weekly Plan Template`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Design Agency Hub Template`** (2 nodes): `Milanote Board 1MPm641PG9On9D (Design Agency Hub)`, `Design Agency Hub Template`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Competitor Landscape Template`** (2 nodes): `Milanote Board 1IwUcd2DP5Ys96 (Competitor Landscape)`, `Competitor Landscape Template`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Team Structure Template`** (2 nodes): `Milanote Board 1Is9WC2poehl9K (Team Structure)`, `Team Structure Template`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Moodboard (Visual Concept)` connect `Board and Canvas Features` to `Template Catalog and Categories`, `Marketing and Campaign Templates`, `Creative Design Categories`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `Milanote BOARD Element Type` connect `Template Catalog and Categories` to `Marketing and Campaign Templates`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `Milanote SKELETON Element Type` connect `Template Catalog and Categories` to `Marketing and Campaign Templates`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `TemplatePicker React Component (CDP Extraction)`, `Template: Campaign Brief (Agencies)`, `Architecture Category` to the rest of the system?**
  _91 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Template Catalog and Categories` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `HTTP Client and CDP Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Project Architecture and Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._