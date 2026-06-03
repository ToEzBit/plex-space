# MVP scope boundary

The first MVP is the smallest coherent version of: keep a list of named Spaces, open one to launch a grid of Terminals running a chosen Agent inside its directory, with Spaces running warm in the background until closed. The decisions behind it are recorded in ADR-0001..0004 and `CONTEXT.md`.

These are **deliberately out of MVP** (recorded so they are not mistaken for oversights, and not re-litigated as "missing features"):

- **Per-Pane Agents** — one Agent applies to all Panes in a Space. *(Still out. Note: per-Pane **working directories** are now in via ADR-0009 — a Pane may run in its own git Worktree — but the Agent stays uniform across Panes.)*
- **Config-driven / auto-detected Agents** — the Agent list is hardcoded (Claude Code → `claude`, Codex CLI → `codex`).
- **Agent flags / model selection** — Agents launch with the bare command, no arguments.
- ~~**Resizable Panes** — the Layout grid is fixed and equal-sized.~~ *Lifted: Panes can now be resized by dragging the boundary between adjacent Panes — see ADR-0008. (Adding/closing/re-splitting Panes mid-session is still out, per the next line.)*
- **Changing Layout/Agent after launch** — and adding/closing/re-splitting Panes mid-session. To work differently, close and reopen the Space.
- **Multiple OS windows / tabs** — one app window; concurrent Spaces are switched within it.
- **Theme / font / appearance settings.**
- **Session restore across app restart** — quitting kills all Terminals; on relaunch, Spaces are listed but closed (no scrollback/agent-state restore).
- **Windows / Linux** — macOS only.
- **Saving / logging Terminal output.**

Minor behaviors are left to sensible defaults and are not blockers: default Space name = folder basename, two Spaces may point at the same directory, quit may show a simple confirm.
