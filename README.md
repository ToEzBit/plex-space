# Plex Space

A macOS desktop app for running AI CLI agents (Claude Code, Codex CLI) in configurable terminal grids.

Keep a list of named **Spaces**, open one to launch a grid of Terminals all running the same agent inside that Space's directory. Multiple Spaces can run concurrently in the background.

## What is a Space?

A **Space** is a saved workspace bound to a single working directory. When you open it, you pick a **Layout** (how many panes) and an **Agent** (which CLI to run). Every pane in the layout gets its own Terminal running that agent — letting you run multiple parallel agent sessions pointed at the same codebase.

- Navigating back to the Space list keeps the Terminals running warm in the background.
- Closing a Space stops its Terminals but keeps it in the list to reopen later.
- Removing a Space from the list is a separate action.

## Features

- **Space list** — create, open, and manage named Spaces at a glance
- **Configurable layouts** — 1, 2, 3, 4, or 6 panes per Space
- **Agent selection** — choose between Claude Code (`claude`) or Codex CLI (`codex`) per session
- **Concurrent Spaces** — multiple Spaces can run simultaneously in the background
- **Persistent list** — Spaces survive app restarts (Terminals restart fresh; no scrollback restore)

## Tech stack

| Layer | Technology |
|---|---|
| App shell | Electron 35 |
| Renderer | React 19 + TypeScript |
| Build | electron-vite + Vite 6 |
| Terminal emulator | xterm.js (`@xterm/xterm`) |
| PTY | node-pty |
| Tests | Vitest |

## Requirements

- macOS (only supported platform)
- Node.js ≥ 18
- Claude Code (`claude`) and/or Codex CLI (`codex`) installed and on your `PATH`

## Getting started

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build a distributable .app
npm run build
```

## Development commands

```bash
npm run dev          # Start dev server with hot-reload
npm run build        # Type-check + build production app
npm run test         # Run unit tests (Vitest)
npm run typecheck    # Type-check main and renderer
npm run lint         # ESLint
npm run format       # Prettier
```

## Project structure

```
src/
  main/        Electron main process — window management, IPC, PTY lifecycle
  preload/     Context bridge between main and renderer
  renderer/    React UI — SpaceList, NewSpaceWizard, PaneTerminal, layout logic
  shared/      Types shared across processes
docs/
  adr/         Architecture Decision Records
  design-system.md
CONTEXT.md     Domain glossary — canonical names for Space, Layout, Pane, Terminal, Agent
```

## Architecture decisions

Key decisions are documented as ADRs in `docs/adr/`:

- **ADR-0001** — Shell spawns first, agent launches inside it (for proper environment sourcing)
- **ADR-0002** — Electron chosen as the app shell
- **ADR-0003** — Spaces run warm in the background after navigation
- **ADR-0004** — A Space stores only name + directory (Layout and Agent are chosen at open time)
- **ADR-0005** — MVP scope boundary (what is intentionally out of scope)
- **ADR-0006** — App stack choices

## MVP scope

The following are **intentionally out of scope** for the current version:

- Per-pane agent selection (all panes in a Space run the same agent)
- Agent flags or model selection
- Resizable panes
- Changing layout or agent after a Space is opened
- Multiple OS windows or tabs
- Theme / font settings
- Session restore across app restart
- Windows / Linux support
- Saving or logging terminal output

## License

MIT
