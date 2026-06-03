import { describe, expect, it, vi } from 'vitest'
import { resolvePanes, type WorktreeOps } from './resolvePanes'
import type { PaneWorktree } from '../shared/worktree'

function ops(over: Partial<WorktreeOps> = {}): WorktreeOps {
  return {
    createWorktree: vi.fn(async (_cwd, branch) => `/repo/.plex-space/worktrees/${branch}`),
    resumeWorktree: vi.fn(async (_cwd, branch) => `/repo/.plex-space/worktrees/${branch}`),
    ...over
  }
}

describe('resolvePanes', () => {
  it('a none Pane runs the Agent in the Space directory, untracked as a worktree', async () => {
    const choices: PaneWorktree[] = [{ kind: 'none' }]
    const [pane] = await resolvePanes('/repo', 1, 'claude', choices, ops())
    expect(pane.spec).toEqual({ cwd: '/repo', agentCommand: 'claude' })
    expect(pane.worktree).toBeUndefined()
  })

  it('a new Pane launches the Agent in the created worktree and is tracked', async () => {
    const choices: PaneWorktree[] = [{ kind: 'new', branch: 'fix-auth' }]
    const [pane] = await resolvePanes('/repo', 1, 'claude', choices, ops())
    expect(pane.spec.cwd).toBe('/repo/.plex-space/worktrees/fix-auth')
    expect(pane.spec.agentCommand).toBe('claude')
    expect(pane.worktree).toEqual({
      branch: 'fix-auth',
      path: '/repo/.plex-space/worktrees/fix-auth'
    })
  })

  it('a resume Pane reattaches via resumeWorktree (not createWorktree)', async () => {
    const o = ops()
    const choices: PaneWorktree[] = [{ kind: 'resume', branch: 'wip' }]
    const [pane] = await resolvePanes('/repo', 1, 'codex', choices, o)
    expect(o.resumeWorktree).toHaveBeenCalledWith('/repo', 'wip')
    expect(o.createWorktree).not.toHaveBeenCalled()
    expect(pane.worktree?.branch).toBe('wip')
  })

  // The locked safety property (ADR-0009): a failed worktree must NOT run the Agent on the base branch.
  it('on worktree-creation failure: bare shell in the Space dir, notice shown, Agent NOT launched', async () => {
    const o = ops({
      createWorktree: vi.fn(async () => {
        throw new Error('fatal: a branch named fix-auth already exists')
      })
    })
    const choices: PaneWorktree[] = [{ kind: 'new', branch: 'fix-auth' }]
    const [pane] = await resolvePanes('/repo', 1, 'claude', choices, o)
    expect(pane.spec.cwd).toBe('/repo') // fell back to the Space directory
    expect(pane.spec.agentCommand).toBeNull() // the Agent is NOT auto-launched
    expect(pane.spec.notice).toContain('fix-auth')
    expect(pane.spec.notice).toContain('already exists')
    expect(pane.worktree).toBeUndefined() // nothing to clean up on close
  })

  it('mixes Pane kinds and defaults missing choices to none', async () => {
    const choices: PaneWorktree[] = [{ kind: 'new', branch: 'a' }, { kind: 'none' }]
    // layout 3 but only 2 choices given → the 3rd defaults to a Space-dir Pane
    const panes = await resolvePanes('/repo', 3, 'claude', choices, ops())
    expect(panes).toHaveLength(3)
    expect(panes[0].worktree?.branch).toBe('a')
    expect(panes[1].worktree).toBeUndefined()
    expect(panes[2].spec).toEqual({ cwd: '/repo', agentCommand: 'claude' })
  })
})
