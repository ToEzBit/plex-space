# Agent availability flag

Status: ready-for-agent

## Parent

`.scratch/mvp/PRD.md`

## What to build

Add the **Agent availability** module: `isInstalled(command)` resolved via an injected exec (wrapping `command -v`), unit-testable with a fake exec. Use it in the wizard's Agent step to flag Agents that are not installed (e.g. `codex` when absent). Launching an uninstalled Agent is still allowed — Model 2 already leaves the Pane usable with a "command not found" shell — so this slice adds the proactive heads-up, not a block.

## Acceptance criteria

- [ ] An Agent availability module exposes `isInstalled(command)` with the exec call injected.
- [ ] Unit tests (Vitest) cover installed vs not-installed via a fake exec.
- [ ] The wizard's Agent step visibly flags Agents whose command is not on PATH.
- [ ] Selecting and launching an uninstalled Agent still opens the grid; the Pane shows the shell's "command not found" and stays usable.

## Blocked by

- `05-new-space-wizard-launch`
