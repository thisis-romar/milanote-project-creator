---
title: Milanote Intro Video — Official Primitive Set
description: Verbatim transcript of the official Milanote intro tutorial video. Canonical reference for what Milanote considers its core element types and user workflows.
version: 1.0.0
created: 2026-04-29T00:00:00Z
last_updated: 2026-04-29T00:00:00Z
---

<!-- source: official Milanote intro tutorial video -->

# Milanote Intro Video — Official Primitive Set

This is the verbatim transcript of Milanote's official intro tutorial video. It is the canonical reference for what Milanote considers its core element types and typical user workflows.

## Transcript

> Milanote was designed to help people organize their creative projects. It's perfect for those early stages when you need a flexible space to brainstorm ideas, collect inspiration, or map out a plan.
>
> In this video you'll learn how to use Milanote to plan a simple project.
>
> Let's imagine we're designing a logo for a new sneaker brand.
>
> You'd start by dragging out a board for the project and giving it a name. Then just double-click to open it.
>
> Once inside you see a freeform canvas that you can add any type of content to.
>
> You can add notes to capture ideas or write a brief summary of the project.
>
> You can drag in images from your computer and add captions to them just by typing.
>
> There's a built-in image library with millions of beautiful photos which is perfect for finding inspiration.
>
> Swatch cards give you an easy way to experiment with color palettes.
>
> And finally you could add a checklist of tasks to help keep the project on track.
>
> Now that everything's in one place it's time to get organized.
>
> Columns are great for grouping related content like these ideas and the background of the project. But you can also visually organize things in any way that makes sense to you.
>
> The powerful thing about Milanote boards is that you can nest them just like the folders on your computer.
>
> Let's create a subboard here to store all the visual references in one place. And instead of starting from scratch we'll use a mood board template. Templates let you drag and drop content into place and save lots of time.
>
> To get back to the project board just use the navigation in the top left.
>
> And when your project is all set up you can invite others to join the board and work on it together. They can add their own ideas, comments, and feedback and you'll be notified each time they do.
>
> That's a quick look at how you can plan a simple project and stay organized with Milanote.

## Element types identified

| Primitive | Description | v0 schema type |
|-----------|-------------|----------------|
| **Board** | Top-level container; drag out, name, double-click to enter | `board` |
| **Nested board** (subboard) | Boards nest like folders; can use Milanote-native templates | `board` (recursive) |
| **Note** | Free text card for ideas or briefs | `note { text }` |
| **Image** | Dragged from computer; caption added by typing | `image { src, caption? }` |
| **Built-in image library** | Stock photos from within Milanote | Out of v0 scope |
| **Swatch card** | Color palette experimentation | `swatch { hex }` |
| **Checklist** | Task list for project tracking | `checklist { items: { text, done? }[] }` |
| **Column** | Grouping structure for related cards | `column { title, cards }` |
| **Freeform placement** | Cards can be placed anywhere on canvas | `position?: { x, y }` on any card |
| **Milanote-native templates** | Pre-built templates (e.g. mood board) | Out of v0 scope — different from our JSON templates |
| **Sharing / collaboration** | Invite collaborators, comments, notifications | Out of v0 scope |

## Key design observations

1. **Freeform canvas is the default** — columns are optional organizational aids, not mandatory structure.
2. **Nested boards are a first-class concept** — described as "just like folders on your computer", implying deep nesting is expected.
3. **Captions are attached to images** — not separate note cards; they're inline text fields below the image.
4. **Swatch cards are distinct from notes** — they have a specific color-picking UI, not just a hex value in a note.
5. **Checklists are distinct from notes** — they have per-item check state, not just `- [ ]` markdown.
6. **Milanote templates** are a native feature separate from our JSON template system. A future v1 could invoke them via `apply template <name>` as a creation shortcut, but v0 builds from primitives.
