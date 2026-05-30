# Walking skeleton: one live Terminal

Status: ready-for-agent

## Parent

`.scratch/mvp/PRD.md`

## What to build

Stand up the Electron project (electron-vite + TypeScript + React + Vitest, `@xterm/xterm` + fit addon, `node-pty` — see ADR-0006) and prove the end-to-end terminal pipe with the thinnest possible feature: launching the app opens a window containing a single live Terminal.

The pty runs in the **main process** (`node-pty` spawning the user's shell), the `xterm.js` instance runs in the **renderer**, and they are connected over IPC. Wire the IPC by **ID from the start**: the main process holds a map keyed by `terminalId` (and is structured to also key by `spaceId`), even though only one Terminal exists now — so the later Space pool is additive rather than a rewrite (ADR-0003). Working directory and shell are hardcoded for this slice.

## Acceptance criteria

- [ ] `npm install` then the dev command launches the Electron app on macOS.
- [ ] The window shows one Terminal running the user's shell; typing and output work both ways.
- [ ] Resizing the window resizes the Terminal (cols/rows update).
- [ ] The pty is owned by the main process; the renderer holds only the `xterm.js` instance.
- [ ] IPC messages carry a `terminalId`; the main process tracks Terminals in an ID-keyed map.
- [ ] Vitest is configured and `npm test` runs (even if only a trivial test exists).

## Blocked by

None - can start immediately.
