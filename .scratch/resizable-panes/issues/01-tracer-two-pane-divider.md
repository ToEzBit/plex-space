# Tracer bullet: draggable divider in the 2-pane Layout

Status: done

## What to build

Introduce draggable Pane resizing for the **2-pane Layout**, building the shared
machinery that every later Layout reuses. The boundary between the two Panes becomes a
draggable divider: dragging it adjusts the Panes' relative sizes live, and on release the
Terminals refit to the new sizes.

Behaviour (per ADR-0008):

- Proportions are **session-only** — held in renderer state, preserved while the user
  switches between open Spaces, and reset to equal when a Space is closed and reopened.
  No change to the store, IPC, preload, or the `Layout` type.
- **Refit on drag-end only** — the Terminal's resize observer is suppressed during an
  active drag; on release it fits once and resizes the PTY a single time, so the Agent's
  TUI does not reflow on every frame.
- A **minimum Pane size** clamps the drag so neither Pane becomes too small for an Agent's
  TUI.
- **Double-clicking** the divider resets the two Panes to equal.
- The **1-pane Layout** has no divider and is unaffected.

This slice is the end-to-end tracer bullet: it proves the model, the nested-flex render
with a draggable gutter, the drag + clamp, the refit-on-release coupling, and the reset —
all in the simplest topology.

## Acceptance criteria

- [x] In a 2-pane Space, a divider between the Panes can be dragged to change their relative widths
- [x] During the drag the Panes resize smoothly; the Terminal reflows and the PTY is resized only once, on release (no resize spam mid-drag)
- [x] Neither Pane can be dragged below the minimum size (≈ 160 px wide / 90 px tall, ≈ 20 cols × 5 rows at 13 px)
- [x] Double-clicking the divider resets both Panes to equal
- [x] Sizes persist when switching to another open Space and back; closing and reopening the Space resets to equal
- [x] The 1-pane Layout renders unchanged (no divider)
- [x] Tests cover the proportion model and the min-size clamp

## Blocked by

- None - can start immediately
