# Resize for the 3-pane asymmetric Layout

Status: done

## What to build

Add draggable resizing to the **3-pane Layout** (two Panes on top, one full-width Pane on
the bottom). Per ADR-0008, the rows-first split for this asymmetric topology is:

- A **full-width horizontal divider** between the top row and the bottom Pane (shared).
- A single **vertical divider within the top row** that resizes the two top Panes; the
  bottom Pane always stays full-width.

Reuses the Slice 1 machinery (min-size clamp, refit-on-release, double-click reset,
session-only sizes).

## Acceptance criteria

- [x] In a 3-pane Space, the horizontal divider resizes the top row against the bottom Pane
- [x] The top row's vertical divider resizes only the two top Panes; the bottom Pane stays full-width
- [x] Min-size clamp, refit-on-release, double-click reset, and session-only sizing all apply
- [x] Tests cover the 3-pane asymmetric topology (`splitsToFractions([])` edge case)

## Blocked by

- `.scratch/resizable-panes/issues/01-tracer-two-pane-divider.md`
