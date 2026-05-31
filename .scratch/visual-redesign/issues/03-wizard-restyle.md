# Wizard restyle

Status: done

## What to build

Restyle the **New/Open wizard** panel onto the token system — every step: directory + name
entry (with Browse), layout selection (1/2/4/6), the agent picker including the "not installed"
badge, the step indicator, and the Back / Next / Launch buttons.

Selection states (layout and agent option buttons) read clearly as selected vs unselected with
hover feedback. The primary action (Next/Launch) uses the cyan accent; the disabled Next is
visually distinct. The "not installed" badge uses the warning token. No hard-coded hex.

See `docs/design-system.md`.

## Acceptance criteria

- [x] All wizard steps render in the Visual System with no hard-coded hex literals
- [x] Layout and agent option buttons have clear selected/unselected + hover states
- [x] The "not installed" badge uses the warning token
- [x] Primary action uses the accent; the disabled Next state is visually distinct

## Blocked by

- `.scratch/visual-redesign/issues/01-design-tokens-space-list.md`
