# Interaction polish pass

Status: ready-for-agent

## What to build

A cross-cutting finish over the restyled surfaces. Make interaction states consistent and
accessible across the Space list, wizard, and grid chrome: hover/active states, a visible 2px
accent focus ring for keyboard navigation (never remove outlines), `150ms ease-out`
transitions on state changes, honoring `prefers-reduced-motion`, and a final polish of the
empty state.

See the Effects section of `docs/design-system.md`.

## Acceptance criteria

- [ ] Interactive elements have consistent hover/active states and a visible accent focus ring on keyboard focus
- [ ] State changes animate at ~150ms ease-out
- [ ] `prefers-reduced-motion` is respected (motion reduced or disabled)
- [ ] The empty state is polished and on-system

## Blocked by

- `.scratch/visual-redesign/issues/01-design-tokens-space-list.md`
- `.scratch/visual-redesign/issues/03-wizard-restyle.md`
- `.scratch/visual-redesign/issues/04-grid-chrome-restyle.md`
