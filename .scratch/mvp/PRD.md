# Plex Space — MVP

Status: ready-for-agent

## Problem Statement

I run AI CLI agents — Claude Code, Codex CLI — to work on my code. Today I manage them by hand: open a terminal, `cd` into a project, launch an agent; open another terminal, launch another; arrange the windows; repeat. When I want several agents working in one project at once, or I want to jump between projects, I'm juggling raw terminal windows and tabs. There is no purpose-built place to spin up a grid of agent terminals scoped to a project directory, and nothing keeps several projects' agent sessions alive while I switch between them.

## Solution

Plex Space is a macOS desktop app. I keep a list of named **Spaces**, each bound to a working directory. I open a Space, pick a **Layout** (1, 2, 4, or 6 panes) and an **Agent**, and the app opens that grid of **Terminals** — each one running the chosen Agent inside the Space's directory. Open Spaces keep running warm in the background, so I can step back to the **Space list** and open or switch to other Spaces without losing any session. A Space's Terminals stop only when I explicitly **Close** the Space or quit the app.

## User Stories

**Space list**
1. As a user, I want to see a list of my saved Spaces when I open the app, so that I can pick up where I left off without re-navigating to directories.
2. As a user, I want each Space to show its name and directory, so that I can tell them apart.
3. As a user, I want Spaces that are currently open to show a "running" indicator, so that I know which are warm versus closed.
4. As a user, I want a "New Space" action on the Space list, so that I can create a new Space.
5. As a user, I want to remove a saved Space from the list, so that I can clean up Spaces I no longer use.

**New Space wizard**
6. As a user, I want to create a Space by choosing a directory, so that the Agents run in the right project.
7. As a user, I want the Space name to default to the directory's folder name (editable), so that I rarely have to type a name.
8. As a user, I want to choose a Layout (1/2/4/6) while creating a Space, so that I get the grid I need.
9. As a user, I want to choose an Agent while creating a Space, so that the Terminals launch the tool I want.
10. As a user, I want to move back and forward between wizard steps, so that I can correct earlier choices.
11. As a user, I want Agents that are not installed to be visibly flagged, so that I am not surprised by a failure.

**Opening and re-attaching**
12. As a user, I want opening a closed Space to ask for Layout and Agent (pre-filled with what I used last), so that I launch quickly but can still vary how I work.
13. As a user, I want clicking a Space that is already running to return me to its live Terminals, so that I resume exactly where I was.
14. As a user, I want Terminals to open in the Space's directory, so that the Agents operate on the right files.

**Layout and Panes**
15. As a user, I want the chosen Layout rendered as an equal-sized grid (side-by-side for 2, 2×2 for 4, 3×2 for 6), so that the Panes are predictable.
16. As a user, I want each Pane to contain exactly one Terminal, so that each Agent has its own area.

**Agents and Terminals**
17. As a user, I want every Pane in a Space to run the same Agent, so that a Space is dedicated to one tool.
18. As a user, I want each Terminal to start my interactive shell and then launch the Agent, so that my environment (PATH, aliases) loads and the Agent binary is found.
19. As a user, I want a Terminal to drop back to a usable shell prompt when the Agent exits, so that I can re-run it or run other commands.
20. As a user, when I pick an Agent that is not installed, I want the Terminal to show "command not found" but stay usable, so that I can install or fix it without the Pane dying.
21. As a user, I want to type into and read from each Terminal like a real terminal, so that I can interact with the Agent.
22. As a user, I want Terminals to resize with their Pane, so that output stays readable.

**Concurrency and lifecycle**
23. As a user, I want to open multiple Spaces and have them all keep running, so that I can work across projects at once.
24. As a user, I want navigating back to the Space list to leave my Terminals running, so that I do not lose Agent sessions when I switch context.
25. As a user, I want a "Close Space" action that stops that Space's Terminals, so that I can free resources when done.
26. As a user, I want closing a Space to keep it in my list (not delete it), so that I can reopen it later.
27. As a user, I want quitting the app to stop all Terminals across all Spaces, so that nothing is left running.

## Implementation Decisions

**Stack** (ADR-0002): Electron, with `node-pty` for the pty layer and `xterm.js` for rendering. macOS only.

**Process split (load-bearing for ADR-0003):** The **Space pool** and all **ptys** live in the **main process**. `node-pty` is main-process-only, and the warm-background model requires ptys to outlive any view — if a renderer view owned them, navigating away would tear them down. The renderer owns views and `xterm.js` instances.

**Warmth and re-attach (decision recorded here, not previously specified):** When the user navigates away from an open Space, its `xterm.js` instances are kept **mounted but hidden** in the renderer (not unmounted), while the main-process ptys keep running. Re-attaching re-shows the existing instances. Trade-off: renderer memory grows with the number of open Spaces. The alternative — main-process output buffering with replay on re-mount — is deferred (see Out of Scope); the simpler mounted-but-hidden approach is used for MVP.

**Deep modules** (each isolation-testable; three map 1:1 to ADRs):

- **Space store** (↔ ADR-0004): owns the persisted list of Spaces, each `{ id, name, directory }` and nothing more. Interface along the lines of `createSpace({ name, directory })`, `listSpaces()`, `removeSpace(id)`. Persistence sits behind the interface so it can be tested against an in-memory backend.
- **Launch-plan builder** (↔ ADR-0001): a pure function from `{ shell, agentCommand }` to the pty spawn arguments plus the command sequence to send into the shell (Model 2: spawn the interactive shell, then launch the Agent). No I/O.
- **Space pool / lifecycle** (↔ ADR-0003): owns which Spaces are open and their running Terminals. Interface along the lines of `openSpace(space, { layout, agent })`, `getOpenSpace(id)` (re-attach returns the existing instance), `closeSpace(id)` (tears down that Space's Terminals), `closeAll()` (on app quit). The terminal-spawner is injected so the pure state logic can be tested with a fake.
- **Agent availability**: resolves whether an Agent's command is on PATH. Interface along the lines of `isInstalled(command)`, with the exec call injected (wraps `command -v`). The Agent registry itself is hardcoded data, not a module.

**Folded (not standalone modules):** Layout geometry is a fixed `1/2/4/6 → grid` lookup (side-by-side, 2×2, 3×2). The app-wide last-used `{ layout, agent }` default (ADR-0004) is a small settings blob folded into the Space store / a settings store — deliberately not stored per Space.

**Agent registry:** exactly two hardcoded entries — Claude Code → `claude`, Codex CLI → `codex` — launched with the bare command, no arguments.

**IPC contract (renderer ↔ main):**
- `openSpace({ spaceId, layout, agent })` — renderer asks main to ensure the Space's Terminals exist (spawn if not open; return handles if already open → re-attach).
- `terminalData` (bidirectional) — renderer → main writes user keystrokes to a pty; main → renderer streams pty output to the matching `xterm.js` instance.
- `resize({ terminalId, cols, rows })` — renderer notifies main of a Pane/Terminal resize.
- `closeSpace({ spaceId })` — main tears down that Space's ptys.
- App quit triggers `closeAll()` in main.

## Testing Decisions

**What makes a good test here:** exercise a module through its public interface and assert on observable behavior, never on internal structure. Inject collaborators (storage backend, exec, terminal-spawner) as fakes so tests are deterministic and never touch the real filesystem, PATH, or ptys.

**Modules to be tested — the four deep modules:**
- **Space store** — create/list/remove against an in-memory backend; assert the persisted shape is exactly `{ id, name, directory }` (guards ADR-0004).
- **Launch-plan builder** — pure input→output; given a shell and an Agent command, assert the spawn args and send-sequence implement Model 2 (guards ADR-0001).
- **Space pool / lifecycle** — with a fake terminal-spawner: opening an already-open Space re-attaches (no second spawn), `closeSpace` tears down only that Space, `closeAll` tears down all (guards ADR-0003).
- **Agent availability** — with a fake exec: installed vs not-installed resolves correctly.

**Out of unit scope (manual / integration for MVP):** the real `node-pty` ↔ `xterm.js` data path, Electron window/IPC wiring, and the DOM UI (Space list, wizard, Pane grid).

**Prior art:** none — this is the first code in the repo. These tests establish the testing conventions; later work should follow them.

## Out of Scope

Governed by **ADR-0005 (MVP scope boundary)**. Deliberately excluded from MVP: per-Pane Agents; config-driven or auto-detected Agents; Agent flags / model selection; resizable Panes; changing Layout/Agent after launch (and adding/closing/re-splitting Panes mid-session); multiple OS windows or tabs; theme/font/appearance settings; session restore across app restart (quitting kills all Terminals — on relaunch, Spaces are listed but closed); Windows/Linux support; and saving/logging Terminal output. Also deferred: the main-process output-buffer-and-replay re-attach strategy (MVP uses mounted-but-hidden instead).

## Further Notes

- On the design machine, `claude` was installed at `~/.local/bin/claude` and `codex` was not installed — making the "Agent not installed" path (story 20) a real, testable case, and reinforcing why each Terminal launches via the interactive shell (ADR-0001) so PATH resolves the Agent.
- The wizard's Layout and Agent steps are the same selection UI reused by the "open a closed Space" flow (story 12); only the first step — directory + name — is unique to creation.
- Suggested next step: run `/to-issues` against this PRD to slice it into tracer-bullet vertical issues under `.scratch/mvp/issues/`.
