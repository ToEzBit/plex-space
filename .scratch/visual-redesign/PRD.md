# Plex Space — Visual Redesign

Status: needs-triage

## Problem Statement

The MVP is functionally complete (issues 01–09) but visually raw: the renderer is styled with
ad-hoc inline-style objects and hard-coded hex literals, there is no shared token system, and
the terminals use the default xterm.js theme and font. The app does not yet look like a
finished product, and it does not match the developer's working environment — a teal
SketchyBar + Nerd Font macOS setup. This is a **visual** gap, not a usability or feature gap.

## Solution

Apply one fixed, designed appearance across the whole app — the **Visual System** recorded in
`docs/design-system.md`. Slate background (`#0F172A`) + a single Electric Cyan accent
(`#2CF9ED`, the user's SketchyBar accent), JetBrainsMono Nerd Font everywhere (a TUI
treatment), and a matching xterm terminal theme + ANSI set.

This is **appearance only**: a single shipped look with **no user-facing theme/font/appearance
settings**. It therefore does **not** reverse ADR-0005 (which deferred *settings*), and the
styling approach (CSS custom properties) is pre-cleared by ADR-0006 — no new ADR is required.

## Scope (surfaces to restyle)

The complete set of existing surfaces — restyled to the Visual System, with no change to flow
or behavior:

1. **Space list** (home) — header + "New Space", space rows (name, path, running badge,
   Close/Remove), and the empty state.
2. **New/Open wizard** — all steps: directory + name, layout `1/2/4/6`, agent picker incl. the
   "not installed" badge, step indicator, Back / Next / Launch.
3. **Grid chrome** — top bar (space name, Close Space, Space List).
4. **Layout grid** — equal-sized `1/2/4/6` arrangement and gaps.
5. **Terminal** — xterm theme, cursor, selection, full 16-color ANSI set, and bundled font.

## Design reference

`docs/design-system.md` is the source of truth for every color, the terminal theme, the
typography decision, and the effects (radius, transitions, focus, reduced-motion). Two
corrections already baked in: `--text-muted` raised to `#8595A8` for WCAG AA, and "running"
status is green (`--success`) while cyan is reserved for actions.

## Suggested work breakdown (for `/to-issues`)

Tracer-bullet vertical slices, each independently shippable:

1. **Token foundation** — define the palette as CSS custom properties in `main.css`; migrate
   one surface (Space list) off hard-coded hex onto `var(--token)` as the reference pattern.
2. **Font bundling** — obtain and bundle the JetBrainsMono Nerd Font asset, `@font-face` it,
   apply to the app and set xterm's `fontFamily`. (Non-trivial; its own slice. The Nerd patch
   is load-bearing for the terminal, where shell/agent prompts emit powerline/git glyphs per
   ADR-0001.)
3. **Wizard restyle** — all steps + "not installed" badge onto the system.
4. **Grid chrome restyle** — top bar.
5. **Terminal theme** — pass the xterm `theme` + ANSI set when constructing each `Terminal`.
6. **Polish pass** — hover/active/focus states, transitions, `prefers-reduced-motion`, empty
   state.

## Out of scope

- Any **settings** to change theme, font, or appearance (ADR-0005 stands).
- Any interaction/layout/feature change: resizable panes, changing layout/agent after launch,
  multiple windows, session restore (all ADR-0005 deferrals stay deferred).
- Windows / Linux. macOS only.

## Done-condition

All five surfaces above render in the Visual System; no hard-coded hex literals remain in the
renderer (tokens only); the terminal uses the bundled font + theme + ANSI set; primary text and
muted text both meet WCAG AA on their backgrounds; hover/active/focus states are present and
`prefers-reduced-motion` is respected; and there are still no user-facing appearance settings.
