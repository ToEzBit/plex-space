# Agent launch via Model 2 (launch-plan builder)

Status: ready-for-agent

## Parent

`.scratch/mvp/PRD.md`

## What to build

Make the Terminal launch an Agent the way ADR-0001 specifies (Model 2): spawn the user's interactive shell, then send the Agent's launch command into it — rather than exec'ing the Agent directly. Introduce a pure **launch-plan builder**: given `{ shell, agentCommand }` it returns the pty spawn arguments plus the sequence to send into the shell. Wire it into the single Terminal from issue 01 (Agent command hardcoded for now, e.g. `claude`). When the Agent exits, the Terminal must remain at a live shell prompt.

## Acceptance criteria

- [ ] The launch-plan builder is a pure function (no I/O) returning spawn args + send-sequence for Model 2.
- [ ] Unit tests (Vitest) assert the builder's output for a given shell + Agent command.
- [ ] Launching the app spawns the shell and then the hardcoded Agent inside it.
- [ ] When the Agent process exits, the Terminal shows a usable shell prompt (the Pane does not die).
- [ ] The shell is interactive, so the user's PATH/env is loaded and the Agent binary resolves even on a non-default PATH.

## Blocked by

- `01-walking-skeleton-one-terminal`
