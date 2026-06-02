# Plex Space

A macOS desktop app for running AI CLI agents. The user keeps a list of named Spaces; opening one launches a grid of terminals — each running the same agent — inside that Space's directory. Multiple Spaces can run at once, and a Space keeps running in the background until it is explicitly closed.

## Language

**Space**:
A named, saved workspace bound to a single working directory — its name and directory are the only things saved. A Space is *open* when its Terminals are running and *closed* when they are not; the saved Space stays in the list either way. Multiple Spaces can be open at the same time. The app is named after it.
_Avoid_: workspace, project, folder, repo

**Command center**:
The persistent sidebar panel beside the active Space's Panes. It contains the Space list and may grow to hold other app-level controls that should stay ambient while the user works in Terminals; it should not show controls for features that do not exist yet.
_Avoid_: dashboard, home, navigation panel

**Space list**:
The Command center section that lists all saved Spaces. The user opens, closes, and switches between Spaces from here without leaving the current view; open Spaces are marked with a ring indicator.
_Avoid_: projects, workspace list, repo list

**Space task list**:
A task list tied to one Space. The Command center may show the active Space's tasks, while task counts on Space rows summarize tasks without expanding every Space into a tree.
_Avoid_: global todo list, app tasks, project tasks

**Layout**:
The arrangement of Panes within an open Space. Selectable as 1, 2, 3, 4, or 6 panes. Panes start equal-sized but their proportions are adjustable while the Space is open; the 3-pane layout places two Panes on top and one full-width Pane on the bottom.
_Avoid_: grid, view, split

**Pane**:
One region in a Layout that holds exactly one Terminal.
_Avoid_: cell, slot, window, tab

**Pane header**:
The always-visible, compact floating island centered near the top edge of a Pane. It provides actions scoped to that Pane while remaining distinct from the Terminal it contains.
_Avoid_: terminal header, toolbar, title bar

**Terminal**:
The terminal emulator instance running inside a single Pane. This is where an Agent actually runs.
_Avoid_: console, tty

**Agent**:
An AI CLI tool that runs inside a Terminal, e.g. Claude Code, Codex CLI.
_Avoid_: tool, CLI, bot, model, assistant

## Relationships

- A **Space** saves only its name and one working directory.
- A **Space** may have one **Space task list**.
- When a Space is opened, the user picks one **Layout** and one **Agent** for that run (defaulting to the last used); neither is part of the saved Space.
- A **Layout** holds N **Panes** (N ∈ {1, 2, 3, 4, 6}).
- A **Pane** has one always-visible **Pane header**.
- A **Pane** runs one **Terminal**.
- A **Terminal** runs one **Agent**.
- The **Agent** applies to every **Pane** in the Space — every Terminal runs the same kind of Agent.
- An open **Space** keeps its **Terminals** running in the background even after the user focuses elsewhere in the **Command center**; multiple Spaces can be open concurrently.
- Closing a **Space** stops its **Terminals** but keeps the Space in the **Space list**; removing it from the list is a separate action.

## Example dialogue

**Dev:** What's in the sidebar?
**User:** The Command center. Its main section is the Space list — all my saved Spaces. I click one to open it, or hit "New Space".
**Dev:** What does a Space remember?
**User:** Just its name and its directory. When I open it, I pick the Layout and Agent for that run — it defaults to whatever I used last. They're not baked into the Space.
**Dev:** So I could open the same Space tomorrow with a different Layout?
**User:** Sure — I just pick differently when I open it.
**Dev:** If I go back to the list, do the Terminals die?
**User:** No — the Space keeps running in the background. I can open another Space alongside it. They only stop when I hit "Close Space" or quit the app.
**Dev:** And "Close Space" — does that delete it?
**User:** No, it just stops the Terminals. The Space is still in my list to reopen. Deleting it is a separate "Remove" action.
