# Background lifecycle + re-attach

Status: done

## Parent

`.scratch/mvp/PRD.md`

## What to build

Introduce the **Space pool / lifecycle** in the main process (ADR-0003): it tracks which Spaces are open and their running Terminals, with the terminal-spawner injected so the state logic is unit-testable with a fake. Multiple Spaces can be open at once and keep running in the background: navigating back to the Space list does not tear down Terminals (the renderer keeps the `xterm.js` instances mounted-but-hidden; main keeps the ptys). The Space list shows a "running" badge on open Spaces, and clicking a running Space re-attaches to its existing live instance rather than spawning a new one.

## Acceptance criteria

- [x] The Space pool tracks open Spaces and their Terminals in the main process.
- [x] Unit tests (Vitest) with a fake spawner cover: opening an already-open Space re-attaches (no second spawn), plus the pool's open/closed bookkeeping.
- [x] Opening Space A, returning to the list, and opening Space B leaves A's Terminals running.
- [x] The Space list shows a "running" indicator on currently-open Spaces.
- [x] Clicking a running Space returns to its existing live Terminals (state preserved), not a fresh grid.

## Blocked by

- `07-persist-spaces-space-list`
