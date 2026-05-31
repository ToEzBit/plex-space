# Space store (pure module)

Status: done

## Parent

`.scratch/mvp/PRD.md`

## What to build

The persistence module for Spaces, built and tested in isolation ahead of its UI consumer so it can proceed in parallel with the terminal-engine slices. A Space persists exactly `{ id, name, directory }` and nothing else (ADR-0004). Expose a small interface — create, list, remove — with the storage mechanism behind the interface so it can be unit-tested against an in-memory backend. Also hold the app-wide last-used `{ layout, agent }` default (ADR-0004) here or in a sibling settings store — explicitly not per Space.

## Acceptance criteria

- [x] A module exposes create / list / remove for Spaces, persisting `{ id, name, directory }` only.
- [x] Creating a Space with no explicit name defaults the name to the directory's basename.
- [x] An app-wide last-used `{ layout, agent }` value can be read and written.
- [x] Unit tests (Vitest) cover create/list/remove against an in-memory backend and assert the persisted shape is exactly `{ id, name, directory }`.
- [x] No dependency on `node-pty`, `xterm`, or any Electron window code.

## Blocked by

- `01-walking-skeleton-one-terminal` (needs the project scaffold + Vitest)
