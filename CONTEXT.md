# Plex Space

A macOS desktop app for running AI CLI agents. The user keeps a list of named Spaces; opening one launches a grid of terminals — each running the same agent — inside that Space's directory. Multiple Spaces can run at once, and a Space keeps running in the background until it is explicitly closed.

## Language

**Space**:
A named, saved workspace bound to a single working directory — its name and directory are the only things saved. A Space is *open* when its Terminals are running and *closed* when they are not; the saved Space stays in the list either way. Multiple Spaces can be open at the same time. The app is named after it.
_Avoid_: workspace, project, folder, repo

**Space list**:
The app's home view: the list of saved Spaces, from which the user opens one or creates a new one. Spaces that are currently open are marked as running.
_Avoid_: dashboard, home, projects

**Layout**:
The arrangement of Panes within an open Space. Selectable as 1, 2, 4, or 6 panes.
_Avoid_: grid, view, split

**Pane**:
One region in a Layout that holds exactly one Terminal.
_Avoid_: cell, slot, window, tab

**Terminal**:
The terminal emulator instance running inside a single Pane. This is where an Agent actually runs.
_Avoid_: console, tty

**Agent**:
An AI CLI tool that runs inside a Terminal, e.g. Claude Code, Codex CLI.
_Avoid_: tool, CLI, bot, model, assistant

## Relationships

- A **Space** saves only its name and one working directory.
- When a Space is opened, the user picks one **Layout** and one **Agent** for that run (defaulting to the last used); neither is part of the saved Space.
- A **Layout** holds N **Panes** (N ∈ {1, 2, 4, 6}).
- A **Pane** runs one **Terminal**.
- A **Terminal** runs one **Agent**.
- The **Agent** applies to every **Pane** in the Space — every Terminal runs the same kind of Agent.
- An open **Space** keeps its **Terminals** running in the background even after the user navigates back to the **Space list**; multiple Spaces can be open concurrently.
- Closing a **Space** stops its **Terminals** but keeps the Space in the **Space list**; removing it from the list is a separate action.

## Example dialogue

**Dev:** What's on the home screen?
**User:** The Space list — all my saved Spaces. I click one to open it, or hit "New Space".
**Dev:** What does a Space remember?
**User:** Just its name and its directory. When I open it, I pick the Layout and Agent for that run — it defaults to whatever I used last. They're not baked into the Space.
**Dev:** So I could open the same Space tomorrow with a different Layout?
**User:** Sure — I just pick differently when I open it.
**Dev:** If I go back to the list, do the Terminals die?
**User:** No — the Space keeps running in the background. I can open another Space alongside it. They only stop when I hit "Close Space" or quit the app.
**Dev:** And "Close Space" — does that delete it?
**User:** No, it just stops the Terminals. The Space is still in my list to reopen. Deleting it is a separate "Remove" action.
