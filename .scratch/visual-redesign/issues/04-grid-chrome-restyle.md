# Grid chrome restyle

Status: ready-for-agent

## What to build

Restyle the open-Space chrome onto the token system: the **top bar** (space name, "Close
Space", "Space List" buttons) and the **layout grid surround** (background + the gaps between
panes).

"Close Space" uses the danger token; "Space List" is a neutral/secondary action. The grid
background and inter-pane gaps use tokens so the panes sit on the Slate surface consistently.
No hard-coded hex.

See `docs/design-system.md`.

## Acceptance criteria

- [ ] The grid top bar renders in the Visual System with no hard-coded hex literals
- [ ] "Close Space" uses the danger token; "Space List" reads as a secondary action
- [ ] The layout grid background and pane gaps use tokens
- [ ] Applies across all layouts (1/2/4/6)

## Blocked by

- `.scratch/visual-redesign/issues/01-design-tokens-space-list.md`
