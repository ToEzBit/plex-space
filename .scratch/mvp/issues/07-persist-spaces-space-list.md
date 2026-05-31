# Persist Spaces + Space list

Status: done

## Parent

`.scratch/mvp/PRD.md`

## What to build

Wire the Space store (issue 02) into the UI. Add the Space list as the app's home view: it lists saved Spaces (name + directory), offers "New Space" (launching the wizard), and lets the user remove a Space from the list. Finishing the wizard now persists the Space `{ id, name, directory }`. Opening a saved (closed) Space goes to the Layout + Agent steps (reusing the wizard's steps 2–3), pre-filled with the app-wide last-used values.

## Acceptance criteria

- [x] The home view lists saved Spaces showing name and directory.
- [x] "New Space" launches the wizard; finishing it persists the Space and it appears in the list.
- [x] A Space can be removed from the list.
- [x] Opening a saved Space prompts for Layout + Agent (reusing wizard steps 2–3), defaulted to the last-used values, then launches the grid.
- [x] Only `{ id, name, directory }` is persisted per Space (Layout/Agent are not).

## Blocked by

- `06-agent-availability-flag`
- `02-space-store`
