# Close Space + quit teardown

Status: ready-for-agent

## Parent

`.scratch/mvp/PRD.md`

## What to build

The explicit teardown paths (ADR-0003). A "Close Space" action stops that Space's Terminals (kills its ptys) but leaves the Space saved in the list. Quitting the app tears down all Terminals across all open Spaces (`closeAll`). Navigating away from a Space is neither — it must keep running (already true from issue 08).

## Acceptance criteria

- [ ] A "Close Space" action stops that Space's Terminals and removes its "running" badge.
- [ ] After Close Space, the Space remains in the list and can be reopened (with fresh Terminals).
- [ ] Quitting the app stops all Terminals across all open Spaces (no orphaned pty processes).
- [ ] "Close Space" affects only the targeted Space; other open Spaces keep running.

## Blocked by

- `08-background-lifecycle-reattach`
