# Plex Space — Visual System

The single, fixed appearance of the app. There are **no user-facing theme/font/appearance
settings** (ADR-0005 defers those, and is *not* reversed by this document — it deferred
*settings*, not "make it look good"). Styling-library choices are left open by ADR-0006, so
adopting CSS custom properties for these tokens needs no ADR.

Direction: **modern dev-tool dark UI** (Warp / Raycast / Linear lineage), tuned to match the
user's teal SketchyBar desktop so the app feels native to their environment.

## Color tokens

Base palette is **Slate** (`#0F172A` family) with a single **Electric Cyan** accent
(`#2CF9ED`, the user's SketchyBar `ACCENT_COLOR`).

| Token | Hex | Role |
| --- | --- | --- |
| `--bg` | `#0F172A` | app background (deepest) |
| `--surface` | `#1A2438` | cards, bars, wizard panel |
| `--elevated` | `#222E45` | hovered/active card, raised surface |
| `--border` | `#2D3A52` | hairline dividers, card borders |
| `--border-strong` | `#3A4A66` | active-card / focused border |
| `--text` | `#F1F5F9` | primary text, headings |
| `--text-secondary` | `#94A3B8` | labels, secondary text (~6:1) |
| `--text-muted` | `#8595A8` | directory paths, hints (~5.6:1 — AA pass) |
| `--accent` | `#2CF9ED` | **actions only**: primary buttons, prompt, cursor, focus |
| `--accent-hover` | `#5FFBF1` | accent hover |
| `--accent-active` | `#1FD6CB` | accent pressed |
| `--on-accent` | `#04141A` | text/icon on an accent fill |
| `--success` | `#35E0A6` | **"running" / success status** (kept distinct from accent) |
| `--warning` | `#F5C45E` | warnings, "not installed" badge |
| `--danger` | `#FF6B7A` | Close Space, destructive, errors |

**Accent discipline:** cyan signals *interactive/action*; green signals *status*. The
"running" badge is green (`--success`), never cyan — otherwise the accent stops reading as
"this is a button." (Earlier mocks conflated the two; resolved here.)

Contrast: `--text-muted` was raised from `#64748B` (~3.7:1, fails WCAG AA) to `#8595A8`
(~5.6:1) because it carries functional text, not decoration.

## Terminal theme (xterm.js)

```
background:          #0B1120
foreground:          #E2E8F0
cursor:              #2CF9ED
cursorAccent:        #04141A
selectionBackground: rgba(44, 249, 237, 0.25)
```

ANSI 16-color set (tuned to the Slate + Cyan scheme):

| # | Name | Normal | Bright |
| --- | --- | --- | --- |
| 0 | black | `#11192B` | `#475569` |
| 1 | red | `#FF6B7A` | `#FF8A96` |
| 2 | green | `#35E0A6` | `#5DEFBE` |
| 3 | yellow | `#F5C45E` | `#FAD584` |
| 4 | blue | `#7DD3FC` | `#A5E0FF` |
| 5 | magenta | `#C4B5FD` | `#DDD0FF` |
| 6 | cyan | `#2CF9ED` | `#6FFBF2` |
| 7 | white | `#E2E8F0` | `#F8FAFC` |

## Typography

**JetBrainsMono Nerd Font** everywhere — chrome *and* terminal (a "TUI" treatment). Stack:
`'JetBrainsMono Nerd Font', ui-monospace, 'JetBrains Mono', Menlo, monospace`.

- Terminal needs the **Nerd patch**: the user's shell/agent prompt (launched via interactive
  shell per ADR-0001) emits powerline separators and git/devicon glyphs that only render with
  a Nerd Font. This is the load-bearing reason to bundle it.
- Chrome only renders plain glyphs (`➜  [x]  //`), so it needs the base letterforms, not the
  patch — but it reuses the same bundled family for visual consistency.

Why mono-everywhere (recorded so it isn't mistaken for an oversight): the app is a terminal
grid for a power user who lives in a teal SketchyBar + Nerd Font setup; a full mono/TUI skin
mirrors that environment. Trade-off accepted: mono chrome is slightly less readable than a
proportional UI font. This is a font swap, not architecture — reversible, so no ADR.

Type scale (px): `11` micro/badges · `12` labels · `13` body/terminal · `14` titles.

## Effects

- Radius: `6–9px` (cards 9, buttons/pills 6–7).
- Elevation: hairline `--border` + soft shadow on raised surfaces (wizard panel, hovered card).
- Transitions: `150ms ease-out` on hover/active/state changes; respect
  `prefers-reduced-motion`.
- Focus: visible `2px` `--accent` ring on keyboard focus (do not remove outlines).

## Surfaces this system applies to

1. **Space list** (home): header, "New Space", space rows (name + path + running badge +
   Close/Remove), and the **empty state** ("No spaces yet").
2. **New/Open wizard** (modal panel): all steps — directory+name, layout `1/2/4/6`, agent
   picker incl. the **"not installed"** badge, step indicator, Back/Next/Launch.
3. **Grid chrome**: top bar (space name, Close Space, Space List).
4. **Layout grid**: equal-sized `1/2/4/6` pane arrangement and gaps.
5. **Terminal**: the xterm theme + font above.

## Implementation note

Centralize the tokens above as CSS custom properties in `:root`
(`src/renderer/src/assets/main.css`) and have components read `var(--token)` instead of the
current hard-coded hex literals in inline-style objects. The xterm theme is passed as the
`theme` option when constructing each `Terminal`.
