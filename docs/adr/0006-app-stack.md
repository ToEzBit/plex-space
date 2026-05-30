# Application stack: electron-vite + TypeScript + React + Vitest

Building on ADR-0002 (Electron), the rest of the stack is: TypeScript throughout, electron-vite as the build tool, React for the renderer UI, Vitest for tests, with `@xterm/xterm` (+ fit addon) for terminal rendering and `node-pty` for ptys.

Why:
- **TypeScript** — the app is interface-driven (Space store, launch-plan builder, Space pool, agent availability) and IPC-heavy; static types keep the module seams and message contracts safe to evolve.
- **electron-vite** — fast HMR with first-class TS/React support and a thin config; handles the main/preload/renderer split and native-module (`node-pty`) rebuild.
- **React** — the UI is small (Space list, wizard, Pane grid) but stateful, and React has the most prior art for embedding `xterm.js`.
- **Vitest** — TS-native and fast; ideal for the pure-module unit tests this project leans on.

## Consequences

React (renderer framework) and electron-vite (build tool) are the sticky choices — swapping either mid-project is a renderer rewrite or a build-system migration. Accepted. Libraries below this line (state management, styling) are left open and need no ADR.
