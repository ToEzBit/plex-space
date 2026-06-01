# Resizable Panes via a rows-first split tree

ADR-0005 deferred resizable Panes; the arrangement was a flat CSS grid of equal `1fr` tracks (`layoutGeometry` → `{ cols, rows, paneSpans }`). We now let the user drag the boundary between adjacent Panes to adjust their proportions, and we model the arrangement as a **binary split tree with rows as the outer axis** rather than as adjustable grid tracks.

Why a split tree, rows-first:
- The requirement is that each Pane resizes **independently** — dragging a vertical boundary in the top row must not move Panes in the bottom row. A uniform grid couples whole columns and rows; a split tree lets each divider affect only its two children.
- A binary tree must commit to an outer axis, which creates an unavoidable asymmetry. **Rows-first** means the horizontal divider(s) between rows span the full width and are shared, while the vertical dividers are independent per row. This matches the user's mental model ("drag the line in the top row, only the top Panes change").

Why not the alternatives:
- **Adjustable grid tracks** (swap `1fr` for draggable `fr` values): nearly free — the existing `ResizeObserver` + `FitAddon` in `PaneTerminal` already refit and notify the PTY. Rejected because dragging a vertical divider would resize an entire column across every row; Panes could not be resized independently, which was the explicit requirement.
- **Free-rectangle layout** (every divider independent): would remove the rows-first asymmetry, but is far more complex than the need (the user only wants to nudge proportions within the existing presets). Rejected as overkill.

## Decisions

- **Tree topology per Layout** (rows-first; outer horizontal splits between rows are full-width and shared, inner vertical splits are independent per row):
  | Layout | Horizontal dividers (full-width, shared) | Vertical dividers (independent per row) |
  |---|---|---|
  | 1 | — | — |
  | 2 (L\|R) | — | 1 |
  | 3 (2 top + 1 full bottom) | 1 (top row / bottom Pane) | 1 (top row only) |
  | 4 (2×2) | 1 | 2 (one per row) |
  | 6 (3×2) | 1 | 4 (two per row) |
- **Sizes are session-only.** Proportions live in renderer state. Switching between open Spaces preserves them (grids stay in the DOM); closing and reopening a Space resets to equal. No change to the store, IPC, preload, or the `Layout` type — `spacePool` uses `layout` only as a **count** of Panes to spawn, so this is a renderer-only change. This keeps ADR-0004 ("a Space stores only its name and directory") intact.
- **Refit on drag-end only.** `PaneTerminal`'s `ResizeObserver` is suppressed during an active drag; on release it fits once and sends a single `resize()` to the PTY. This avoids the SIGWINCH storm that would otherwise make agent TUIs reflow on every frame.
- **Minimum Pane size ≈ 160 × 90 px** (≈ 20 cols × 5 rows at 13 px) clamps the drag so a Pane never becomes too narrow for an Agent's TUI.
- **Double-click a divider** resets it to equal.
- **Scope is resize only.** Adding, closing, or re-splitting Panes mid-session remains out of scope (ADR-0005).

## Consequences

- `layoutGeometry.ts` and the grid render in `App.tsx` change from a flat CSS grid (`gridTemplateColumns/Rows: repeat(n, 1fr)`) to nested flex containers with draggable gutters.
- Main, preload, store, and the `Layout` union (`1 | 2 | 3 | 4 | 6`) are unchanged; `Layout` still means "how many Panes / which preset topology," not their sizes.
- The rows-first asymmetry is permanent for a given Layout: the horizontal divider can only be dragged full-width. Accepted as the cost of a binary tree; revisiting would mean the rejected free-rectangle model.
- Suppressing the `ResizeObserver` during a drag requires `App.tsx` to pass a "dragging" signal down to each `PaneTerminal` — the observer lives in the child but the drag is handled in the parent.
