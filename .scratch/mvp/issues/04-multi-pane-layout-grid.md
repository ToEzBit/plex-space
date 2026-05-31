# Multi-pane Layout grid

Status: done

## Parent

`.scratch/mvp/PRD.md`

## What to build

Render a chosen Layout as an equal-sized grid of Panes, each holding its own Terminal, all running the same (still hardcoded) Agent in the same (still hardcoded) directory. Introduce the Layout geometry mapping: 1 = full, 2 = side-by-side, 4 = 2×2, 6 = 3 columns × 2 rows. Each Pane gets an independent Terminal via the ID-keyed IPC from issue 01.

## Acceptance criteria

- [x] Selecting (in code/config for this slice) a Layout of 1/2/4/6 renders that many Panes in the specified geometry.
- [x] Each Pane contains exactly one Terminal, each backed by its own main-process pty.
- [x] All Panes run the same Agent (Model 2) in the same directory.
- [x] Panes are equal-sized; resizing the window resizes all Terminals.

## Blocked by

- `03-agent-launch-model-2`
