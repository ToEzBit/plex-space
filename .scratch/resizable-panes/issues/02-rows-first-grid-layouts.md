# Rows-first resize for the 4-pane (2×2) and 6-pane (3×2) Layouts

Status: ready-for-agent

## What to build

Extend draggable resizing to the **4-pane (2×2)** and **6-pane (3×2)** Layouts using the
rows-first split model from ADR-0008:

- A single **full-width horizontal divider** between the rows. It is shared — dragging it
  resizes both rows across every column at once.
- **Vertical dividers are independent per row.** Each row has its own vertical divider(s)
  that resize only that row's Panes.

The 6-pane Layout is the three-column extension of the same pattern (two independent
vertical dividers per row). Because the vertical dividers are independent per row, the
columns of different rows need not line up — a deliberate consequence of rows-first
(see ADR-0008). All other behaviour (min-size clamp, refit-on-release, double-click reset,
session-only sizes) is inherited from the Slice 1 machinery.

## Acceptance criteria

- [ ] In a 2×2 Space, the full-width horizontal divider resizes top and bottom rows together; each row's vertical divider resizes only that row's two Panes
- [ ] In a 3×2 Space, the same holds with two independent vertical dividers per row
- [ ] Vertical dividers in different rows can sit at different positions (columns may be ragged) without affecting other rows
- [ ] Min-size clamp, refit-on-release, double-click reset, and session-only sizing all apply
- [ ] Tests cover the rows-first topology for both the 4-pane and 6-pane Layouts

## Blocked by

- `.scratch/resizable-panes/issues/01-tracer-two-pane-divider.md`
