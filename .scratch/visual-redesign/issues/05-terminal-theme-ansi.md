# Terminal theme + ANSI 16-color set

Status: done

## What to build

Apply the xterm **terminal theme** from `docs/design-system.md` when constructing each
Terminal: background, foreground, cursor, cursorAccent, selection, and the full **16-color
ANSI set**. (Font is handled separately in the Nerd Font slice.)

The theme is passed as the `theme` option at `Terminal` construction so every pane — and every
re-attached Space — renders identical colors.

## Acceptance criteria

- [x] Each terminal is constructed with the design-system xterm theme (background/foreground/cursor/cursorAccent/selection)
- [x] The full 16-color ANSI set from `docs/design-system.md` is applied
- [x] Colors are consistent across all panes in a layout and across re-attached Spaces

## Blocked by

- `.scratch/visual-redesign/issues/02-bundle-nerd-font.md` (terminal font + theme land together)
