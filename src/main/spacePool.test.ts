import { beforeEach, describe, expect, it } from 'vitest'
import { SpacePool, type TerminalSpawner } from './spacePool'

class FakeSpawner implements TerminalSpawner {
  spawned: Array<{ terminalId: string; cwd: string; agentCommand: string }> = []
  killed: string[] = []

  spawn(terminalId: string, cwd: string, agentCommand: string): void {
    this.spawned.push({ terminalId, cwd, agentCommand })
  }

  kill(terminalId: string): void {
    this.killed.push(terminalId)
  }
}

describe('SpacePool', () => {
  let pool: SpacePool
  let spawner: FakeSpawner

  beforeEach(() => {
    spawner = new FakeSpawner()
    pool = new SpacePool(spawner)
  })

  describe('open', () => {
    it('spawns one terminal per layout pane for a new space', () => {
      pool.open('space-1', '/project', 4, 'claude')
      expect(spawner.spawned).toHaveLength(4)
    })

    it('returns isNew: true for first open', () => {
      const result = pool.open('space-1', '/project', 2, 'claude')
      expect(result.isNew).toBe(true)
    })

    it('returns terminalIds of length equal to layout', () => {
      const { terminalIds } = pool.open('space-1', '/project', 2, 'claude')
      expect(terminalIds).toHaveLength(2)
    })

    it('re-attaches without spawning when space is already open', () => {
      const first = pool.open('space-1', '/project', 2, 'claude')
      const second = pool.open('space-1', '/project', 2, 'claude')
      expect(spawner.spawned).toHaveLength(2) // no second spawn
      expect(second.terminalIds).toEqual(first.terminalIds)
      expect(second.isNew).toBe(false)
    })

    it('marks the space as open', () => {
      pool.open('space-1', '/project', 2, 'claude')
      expect(pool.isOpen('space-1')).toBe(true)
    })

    it('passes cwd and agentCommand to the spawner', () => {
      pool.open('space-1', '/my/dir', 1, 'codex')
      expect(spawner.spawned[0].cwd).toBe('/my/dir')
      expect(spawner.spawned[0].agentCommand).toBe('codex')
    })

    it('independent spaces each get their own spawn calls', () => {
      pool.open('space-1', '/a', 2, 'claude')
      pool.open('space-2', '/b', 1, 'codex')
      expect(spawner.spawned).toHaveLength(3)
      expect(pool.isOpen('space-1')).toBe(true)
      expect(pool.isOpen('space-2')).toBe(true)
    })
  })

  describe('close', () => {
    it('kills all terminals for the space', () => {
      const { terminalIds } = pool.open('space-1', '/project', 4, 'claude')
      pool.close('space-1')
      expect(spawner.killed.sort()).toEqual(terminalIds.sort())
    })

    it('removes space from the open set', () => {
      pool.open('space-1', '/project', 2, 'claude')
      pool.close('space-1')
      expect(pool.isOpen('space-1')).toBe(false)
    })

    it('is a no-op for an unknown space', () => {
      expect(() => pool.close('nonexistent')).not.toThrow()
      expect(spawner.killed).toHaveLength(0)
    })

    it('only closes the targeted space, leaving others open', () => {
      pool.open('space-1', '/a', 2, 'claude')
      pool.open('space-2', '/b', 1, 'claude')
      pool.close('space-1')
      expect(pool.isOpen('space-1')).toBe(false)
      expect(pool.isOpen('space-2')).toBe(true)
      expect(spawner.killed).toHaveLength(2)
    })
  })

  describe('closeAll', () => {
    it('kills all terminals across all open spaces', () => {
      pool.open('space-1', '/a', 2, 'claude')
      pool.open('space-2', '/b', 1, 'codex')
      pool.closeAll()
      expect(spawner.killed).toHaveLength(3) // 2 + 1
    })

    it('leaves no open spaces after closeAll', () => {
      pool.open('space-1', '/a', 2, 'claude')
      pool.open('space-2', '/b', 1, 'codex')
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
      pool.open('space-1', '/a', 1, 'claude')
      pool.open('space-2', '/b', 1, 'codex')
      expect(pool.openIds()).toContain('space-1')
      expect(pool.openIds()).toContain('space-2')
      expect(pool.openIds()).toHaveLength(2)
    })

    it('excludes closed spaces', () => {
      pool.open('space-1', '/a', 1, 'claude')
      pool.open('space-2', '/b', 1, 'codex')
      pool.close('space-1')
      expect(pool.openIds()).toEqual(['space-2'])
    })
  })
})
