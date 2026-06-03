import { beforeEach, describe, expect, it } from 'vitest'
import { SpacePool, type TerminalSpawner, type TerminalSpec, type PaneLaunch } from './spacePool'

class FakeSpawner implements TerminalSpawner {
  spawned: Array<{ terminalId: string; spec: TerminalSpec }> = []
  killed: string[] = []

  spawn(terminalId: string, spec: TerminalSpec): void {
    this.spawned.push({ terminalId, spec })
  }

  kill(terminalId: string): void {
    this.killed.push(terminalId)
  }
}

/** Build `n` plain (no-worktree) panes in the Space directory running `agent`. */
function panes(n: number, cwd: string, agent: string | null): PaneLaunch[] {
  return Array.from({ length: n }, () => ({
    spec: { cwd, agentCommand: agent }
  }))
}

describe('SpacePool', () => {
  let pool: SpacePool
  let spawner: FakeSpawner

  beforeEach(() => {
    spawner = new FakeSpawner()
    pool = new SpacePool(spawner)
  })

  describe('open', () => {
    it('spawns one terminal per pane for a new space', () => {
      pool.open('space-1', panes(4, '/project', 'claude'))
      expect(spawner.spawned).toHaveLength(4)
    })

    it('returns isNew: true for first open', () => {
      const result = pool.open('space-1', panes(2, '/project', 'claude'))
      expect(result.isNew).toBe(true)
    })

    it('returns terminalIds of length equal to the pane count', () => {
      const { terminalIds } = pool.open('space-1', panes(2, '/project', 'claude'))
      expect(terminalIds).toHaveLength(2)
    })

    it('re-attaches without spawning when space is already open', () => {
      const first = pool.open('space-1', panes(2, '/project', 'claude'))
      const second = pool.open('space-1', panes(2, '/project', 'claude'))
      expect(spawner.spawned).toHaveLength(2) // no second spawn
      expect(second.terminalIds).toEqual(first.terminalIds)
      expect(second.isNew).toBe(false)
    })

    it('marks the space as open', () => {
      pool.open('space-1', panes(2, '/project', 'claude'))
      expect(pool.isOpen('space-1')).toBe(true)
    })

    it('passes each pane spec to the spawner', () => {
      pool.open('space-1', panes(1, '/my/dir', 'codex'))
      expect(spawner.spawned[0].spec.cwd).toBe('/my/dir')
      expect(spawner.spawned[0].spec.agentCommand).toBe('codex')
    })

    it('spawns per-pane specs with their own cwd (worktree panes)', () => {
      pool.open('space-1', [
        { spec: { cwd: '/project', agentCommand: 'claude' } },
        {
          spec: {
            cwd: '/project/.plex-space/worktrees/fix',
            agentCommand: 'claude'
          },
          worktree: {
            branch: 'fix',
            path: '/project/.plex-space/worktrees/fix'
          }
        }
      ])
      expect(spawner.spawned[0].spec.cwd).toBe('/project')
      expect(spawner.spawned[1].spec.cwd).toBe('/project/.plex-space/worktrees/fix')
    })

    it('independent spaces each get their own spawn calls', () => {
      pool.open('space-1', panes(2, '/a', 'claude'))
      pool.open('space-2', panes(1, '/b', 'codex'))
      expect(spawner.spawned).toHaveLength(3)
      expect(pool.isOpen('space-1')).toBe(true)
      expect(pool.isOpen('space-2')).toBe(true)
    })
  })

  describe('close', () => {
    it('kills all terminals for the space', () => {
      const { terminalIds } = pool.open('space-1', panes(4, '/project', 'claude'))
      pool.close('space-1')
      expect(spawner.killed.sort()).toEqual(terminalIds.sort())
    })

    it('removes space from the open set', () => {
      pool.open('space-1', panes(2, '/project', 'claude'))
      pool.close('space-1')
      expect(pool.isOpen('space-1')).toBe(false)
    })

    it('returns the managed worktrees so the caller can clean them up', () => {
      pool.open('space-1', [
        { spec: { cwd: '/project', agentCommand: 'claude' } },
        {
          spec: {
            cwd: '/project/.plex-space/worktrees/fix',
            agentCommand: 'claude'
          },
          worktree: {
            branch: 'fix',
            path: '/project/.plex-space/worktrees/fix'
          }
        }
      ])
      const worktrees = pool.close('space-1')
      expect(worktrees).toEqual([{ branch: 'fix', path: '/project/.plex-space/worktrees/fix' }])
    })

    it('returns an empty list for an unknown space and does not throw', () => {
      expect(() => pool.close('nonexistent')).not.toThrow()
      expect(pool.close('nonexistent')).toEqual([])
      expect(spawner.killed).toHaveLength(0)
    })

    it('only closes the targeted space, leaving others open', () => {
      pool.open('space-1', panes(2, '/a', 'claude'))
      pool.open('space-2', panes(1, '/b', 'claude'))
      pool.close('space-1')
      expect(pool.isOpen('space-1')).toBe(false)
      expect(pool.isOpen('space-2')).toBe(true)
      expect(spawner.killed).toHaveLength(2)
    })
  })

  describe('closeAll', () => {
    it('kills all terminals across all open spaces', () => {
      pool.open('space-1', panes(2, '/a', 'claude'))
      pool.open('space-2', panes(1, '/b', 'codex'))
      pool.closeAll()
      expect(spawner.killed).toHaveLength(3) // 2 + 1
    })

    it('leaves no open spaces after closeAll', () => {
      pool.open('space-1', panes(2, '/a', 'claude'))
      pool.open('space-2', panes(1, '/b', 'codex'))
      pool.closeAll()
      expect(pool.openIds()).toHaveLength(0)
    })

    it('is a no-op when no spaces are open', () => {
      expect(() => pool.closeAll()).not.toThrow()
      expect(spawner.killed).toHaveLength(0)
    })
  })

  describe('openIds', () => {
    it('returns empty array with no open spaces', () => {
      expect(pool.openIds()).toEqual([])
    })

    it('returns all open space ids', () => {
      pool.open('space-1', panes(1, '/a', 'claude'))
      pool.open('space-2', panes(1, '/b', 'codex'))
      expect(pool.openIds()).toContain('space-1')
      expect(pool.openIds()).toContain('space-2')
      expect(pool.openIds()).toHaveLength(2)
    })

    it('excludes closed spaces', () => {
      pool.open('space-1', panes(1, '/a', 'claude'))
      pool.open('space-2', panes(1, '/b', 'codex'))
      pool.close('space-1')
      expect(pool.openIds()).toEqual(['space-2'])
    })
  })

  describe('openBranches', () => {
    it('is empty when no worktree panes are open', () => {
      pool.open('space-1', panes(2, '/a', 'claude'))
      expect(pool.openBranches().size).toBe(0)
    })

    it('collects worktree branches across open spaces and drops them on close', () => {
      pool.open('space-1', [
        {
          spec: { cwd: '/a/.plex-space/worktrees/fix', agentCommand: 'claude' },
          worktree: { branch: 'fix', path: '/a/.plex-space/worktrees/fix' }
        }
      ])
      pool.open('space-2', [
        {
          spec: { cwd: '/b/.plex-space/worktrees/exp', agentCommand: 'codex' },
          worktree: { branch: 'exp', path: '/b/.plex-space/worktrees/exp' }
        }
      ])
      expect(pool.openBranches()).toEqual(new Set(['fix', 'exp']))
      pool.close('space-1')
      expect(pool.openBranches()).toEqual(new Set(['exp']))
    })
  })
})
