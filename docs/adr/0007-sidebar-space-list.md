# Replace header navigation with a persistent sidebar Space list

The Space list was previously a full-screen view separate from the terminal grid. Switching between open Spaces required navigating away from the current grid, back to the list, then selecting another Space. We replaced this with a persistent 200 px sidebar that is always visible alongside the active Space's Panes.

Why:
- Agents are long-lived sessions (ADR-0003). Navigating to a separate list view to switch Spaces interrupted the user's context unnecessarily — the list should be ambient, not a destination.
- A persistent sidebar lets the user see which Spaces are open and switch between them without leaving the active grid, which matches how the app is actually used (monitoring multiple concurrent Spaces).

Why not the alternatives:
- **Keeping the full-screen Space list**: simpler code, but forces a full context switch on every Space navigation — at odds with ADR-0003's "warm background" model.
- **Tab bar (like browser tabs)**: shorter vertically but names truncate aggressively when many Spaces are open; a sidebar scales better.
- **Header-based switcher (dropdown)**: saves vertical space but requires an extra click to see the list and gives no at-a-glance overview of running Spaces.

## Decisions

- Sidebar is **200 px wide**, always visible, not resizable (MVP; resizing is out of scope per ADR-0005). This leaves enough room to scan Space names, directory basenames, and running status without making the panel dominant.
- Each Space item shows its **name** and a **ring indicator**: accent-colored ring = active, success-colored ring = open but not active, no ring = closed.
- A **toggle button** (semi-transparent pill on the sidebar edge) collapses the sidebar to reclaim terminal space when the user needs it.
- When no Space is active (app launch, or after closing the last Space), the main area shows an **empty state** prompt. There is no longer a separate full-screen Space list view.
- "New Space" action moves to the **bottom of the sidebar**.
- "Close Space" moves to a **status bar at the bottom** of the main area (no top bar).

## Consequences

- The `view` state machine in `App.tsx` loses the `'list'` state; navigation is now driven by `activeSpaceId` alone.
- `SpaceList.tsx` is repurposed as the sidebar component; its full-screen layout is removed.
- Terminal real estate is reduced by 200 px horizontally while the sidebar is open. Accepted: the toggle provides an escape hatch when the user needs full width.
