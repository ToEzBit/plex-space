import type { PaneWorktree } from '../shared/worktree'
import type { PaneLaunch } from './spacePool'
import { createWorktree as realCreate, resumeWorktree as realResume } from './worktree'

/** The worktree operations resolvePanes depends on — injectable so the seam can be tested. */
export interface WorktreeOps {
  createWorktree: (cwd: string, branch: string) => Promise<string>
  resumeWorktree: (cwd: string, branch: string) => Promise<string>
}

const realOps: WorktreeOps = { createWorktree: realCreate, resumeWorktree: realResume }

/**
 * Turns the wizard's per-Pane choices into launch specs, creating/resuming worktrees as needed.
 *
 * Safety property (ADR-0009): if a worktree cannot be created, that Pane falls back to a bare
 * shell in the Space directory with the error shown as a notice and `agentCommand: null` — the
 * Agent is NEVER auto-launched on the base branch behind the user's back.
 */
export async function resolvePanes(
  cwd: string,
  layout: number,
  agentCommand: string,
  paneChoices: PaneWorktree[],
  ops: WorktreeOps = realOps
): Promise<PaneLaunch[]> {
  const panes: PaneLaunch[] = []
  for (let i = 0; i < layout; i++) {
    const choice = paneChoices[i] ?? { kind: 'none' }
    if (choice.kind === 'none') {
      panes.push({ spec: { cwd, agentCommand } })
      continue
    }
    try {
      const path =
        choice.kind === 'new'
          ? await ops.createWorktree(cwd, choice.branch)
          : await ops.resumeWorktree(cwd, choice.branch)
      panes.push({ spec: { cwd: path, agentCommand }, worktree: { branch: choice.branch, path } })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      panes.push({
        spec: {
          cwd,
          agentCommand: null,
          notice: `\r\n\x1b[31mWorktree '${choice.branch}' failed:\x1b[0m ${message}\r\n`
        }
      })
    }
  }
  return panes
}
