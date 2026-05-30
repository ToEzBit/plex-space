# Spawn an interactive shell per Terminal, then launch the Agent inside it

Each Terminal could either run the Agent CLI directly as its pty process, or run the user's interactive shell and then launch the Agent inside it. We chose the latter: every Terminal spawns the user's interactive shell (e.g. `zsh`), then sends the Agent's launch command into the pty.

Rationale:
- The interactive shell loads the user's environment (PATH, `.zshrc`, version managers), so Agent binaries on a non-default PATH are found — e.g. `claude` lives at `~/.local/bin/claude`.
- When the Agent exits, the Pane drops back to a live shell prompt instead of dying, so the user can re-launch the Agent, run git, etc.
- If the chosen Agent is not installed (e.g. `codex` absent), the shell shows "command not found" but the Pane stays usable for installing/fixing — no hard crash.

## Consequences

The Pane's root process is a shell, not the Agent, so "is the Agent running?" is not simply "is the pty alive?". If pane-level Agent state is ever needed (e.g. a status badge), it must be inferred separately rather than read from the process exit. Accepted as worth it for the robustness and native-terminal feel.
