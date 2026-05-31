# Design tokens + Space list restyle

Status: ready-for-agent

## What to build

Introduce the Visual System's color tokens as CSS custom properties (the full palette in
`docs/design-system.md`, made available app-wide) and restyle the **Space list** (home view)
to consume them — with no hard-coded hex literals left in that surface. This establishes the
token-consumption pattern every later surface follows.

Covers the header + "New Space" action, each space row (name, directory path, running badge,
Close, Remove), the row hover state, and the empty state ("No spaces yet"). The running badge
uses the **green success token**, not the cyan accent — cyan is reserved for actions.

See `docs/design-system.md` for the exact tokens and `.scratch/visual-redesign/PRD.md` for
scope.

## Acceptance criteria

- [ ] The full palette from `docs/design-system.md` exists as CSS custom properties available app-wide
- [ ] The Space list (header, New Space, rows, Close/Remove, running badge, empty state) renders in the Slate + Cyan system with no hard-coded hex literals
- [ ] The running badge uses the green success token; cyan appears only on actions
- [ ] Secondary and muted text meet WCAG AA contrast on their backgrounds

## Blocked by

None - can start immediately
