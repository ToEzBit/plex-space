/**
 * Per-Pane worktree choice, made in the wizard and sent to the main process at open time.
 * See docs/adr/0009-per-pane-git-worktrees.md.
 */
export type PaneWorktree =
  | { kind: 'none' } // run the Agent in the Space's directory
  | { kind: 'new'; branch: string } // create a new worktree on a new branch off HEAD
  | { kind: 'resume'; branch: string } // reattach to an existing branch / managed worktree

/** A Plex-managed worktree, surfaced to the wizard's resume picker. */
export interface ManagedWorktree {
  branch: string
  path: string
  state: 'clean' | 'dirty'
  /** Currently checked out by an open Space — cannot be reattached. */
  inUse: boolean
}

/** A worktree that was kept (not removed) when a Space closed, reported back so the user is warned. */
export interface KeptWorktree {
  branch: string
  path: string
  reason: 'dirty'
}
