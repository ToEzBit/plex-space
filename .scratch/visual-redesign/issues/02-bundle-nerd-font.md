# Bundle JetBrainsMono Nerd Font

Status: done

## What to build

Bundle **JetBrainsMono Nerd Font** as a local application asset, register it via `@font-face`,
set it as the application font family (TUI treatment — chrome *and* terminal), and set it as
xterm's `fontFamily` so terminals render in it.

The Nerd patch is load-bearing for the **terminal**: the user's shell/agent prompt — launched
via the interactive shell per ADR-0001 — emits powerline separators and git/devicon glyphs
that only render with a Nerd Font. The chrome reuses the same family for visual consistency.
The font must be a bundled asset, not a network/CDN dependency (the app is offline-capable and
ships one fixed look).

## Acceptance criteria

- [x] JetBrainsMono Nerd Font is bundled as a local asset (no network/CDN font load)
- [x] App chrome renders in the bundled font
- [x] Terminals render in the bundled font and Nerd glyphs (powerline / git icons) display correctly
- [x] The font stack degrades to a system monospace if the asset is unavailable

## Blocked by

- `.scratch/visual-redesign/issues/01-design-tokens-space-list.md` (shares the renderer styling foundation)
