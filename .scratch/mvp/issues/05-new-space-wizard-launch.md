# New Space wizard → launch a grid

Status: ready-for-agent

## Parent

`.scratch/mvp/PRD.md`

## What to build

The 3-step New Space wizard that drives a real launch: Step 1 directory + name (name defaults to the folder basename, editable), Step 2 Layout, Step 3 Agent (chosen from the hardcoded registry: Claude Code → `claude`, Codex CLI → `codex`), with Back/Next navigation. Finishing the wizard launches the grid (issue 04) in the chosen directory running the chosen Agent. No persistence or availability-flagging yet — this slice is about the launch flow producing a real grid from the user's choices.

## Acceptance criteria

- [ ] A 3-step wizard collects directory + name, Layout, and Agent, with Back/Next navigation.
- [ ] The directory is chosen via the native folder picker; the name defaults to the directory's basename and is editable.
- [ ] Finishing the wizard opens the grid in the chosen directory with all Panes running the chosen Agent.
- [ ] The Agent options come from the hardcoded 2-entry registry.

## Blocked by

- `04-multi-pane-layout-grid`
