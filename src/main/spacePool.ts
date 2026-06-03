import type { OpenGridResult } from '../shared/spaceRuntime'

/** Everything a Terminal needs to launch. cwd may be the Space directory or a worktree path. */
export interface TerminalSpec {
  cwd: string
  /** Agent command to send into the shell, or null to leave the Pane at a bare shell prompt. */
  agentCommand: string | null
  /** Text to display in the Pane before the shell (e.g. a git error), via the data sink — never executed. */
  notice?: string
}

/** A managed worktree backing one Pane, tracked so the Space can clean it up on close. */
export interface WorktreeRef {
  branch: string
  path: string
}

/** One Pane's launch: how to spawn it, and the worktree (if any) it is bound to. */
export interface PaneLaunch {
  spec: TerminalSpec
  worktree?: WorktreeRef
}

export interface TerminalSpawner {
  spawn(terminalId: string, spec: TerminalSpec): void
  kill(terminalId: string): void
}

interface OpenSpaceEntry {
  terminalIds: string[]
  paneCwds: string[]
  worktrees: WorktreeRef[]
}

export class SpacePool {
  private pool = new Map<string, OpenSpaceEntry>()

  constructor(private spawner: TerminalSpawner) {}

  open(spaceId: string, panes: PaneLaunch[]): OpenGridResult {
    const existing = this.pool.get(spaceId)
    if (existing) {
      return {
        terminalIds: existing.terminalIds,
        paneCwds: existing.paneCwds,
        isNew: false
      }
    }

    const terminalIds = panes.map((_, i) => `${spaceId}:${i}`)
    const paneCwds = panes.map((pane) => pane.spec.cwd)
    panes.forEach((pane, i) => this.spawner.spawn(terminalIds[i], pane.spec))

    const worktrees = panes
      .map((pane) => pane.worktree)
      .filter((wt): wt is WorktreeRef => wt !== undefined)

    this.pool.set(spaceId, { terminalIds, paneCwds, worktrees })
    return { terminalIds, paneCwds, isNew: true }
  }

  /** Kills the Space's Terminals and returns its managed worktrees so the caller can clean them up. */
  close(spaceId: string): WorktreeRef[] {
    const entry = this.pool.get(spaceId)
    if (!entry) return []
    for (const terminalId of entry.terminalIds) {
      this.spawner.kill(terminalId)
    }
    this.pool.delete(spaceId)
    return entry.worktrees
  }

  /** Kills every open Space's Terminals. Worktree cleanup lives in the IPC layer and is skipped on quit. */
  closeAll(): void {
    for (const spaceId of Array.from(this.pool.keys())) this.close(spaceId)
  }

  isOpen(spaceId: string): boolean {
    return this.pool.has(spaceId)
  }

  openIds(): string[] {
    return Array.from(this.pool.keys())
  }

  /** Branches currently checked out by open Spaces — a branch here cannot be reattached. */
  openBranches(): Set<string> {
    const branches = new Set<string>()
    for (const entry of this.pool.values()) {
      for (const wt of entry.worktrees) branches.add(wt.branch)
    }
    return branches
  }
}
