import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryBackend, SpaceStore } from './spaceStore'

describe('SpaceStore', () => {
  let store: SpaceStore

  beforeEach(() => {
    store = new SpaceStore(new MemoryBackend())
  })

  describe('create', () => {
    it('stores exactly { id, name, directory } — no extra fields', () => {
      const space = store.create({ name: 'My Project', directory: '/home/user/project' })
      expect(Object.keys(space).sort()).toEqual(['directory', 'id', 'name'])
    })

    it('persists the given name and directory', () => {
      const space = store.create({ name: 'My Project', directory: '/home/user/project' })
      expect(space).toEqual({ id: space.id, name: 'My Project', directory: '/home/user/project' })
    })

    it.each([
      ['omitted', undefined],
      ['empty', ''],
      ['whitespace', '   ']
    ] as const)('defaults name to directory basename when name is %s', (_, name) => {
      const space = store.create({ name, directory: '/home/user/my-project' })
      expect(space.name).toBe('my-project')
    })

    it('assigns a unique id to each space', () => {
      const a = store.create({ directory: '/a' })
      const b = store.create({ directory: '/b' })
      expect(a.id).not.toBe(b.id)
    })
  })

  describe('list', () => {
    it('returns empty array before any space is created', () => {
      expect(store.list()).toEqual([])
    })

    it('returns all created spaces in insertion order', () => {
      const a = store.create({ name: 'A', directory: '/a' })
      const b = store.create({ name: 'B', directory: '/b' })
      expect(store.list()).toEqual([a, b])
    })
  })

  describe('remove', () => {
    it('removes the space with the given id', () => {
      const a = store.create({ name: 'A', directory: '/a' })
      const b = store.create({ name: 'B', directory: '/b' })
      store.remove(a.id)
      expect(store.list()).toEqual([b])
    })

    it('is a no-op for an unknown id', () => {
      store.create({ name: 'A', directory: '/a' })
      expect(() => store.remove('nonexistent')).not.toThrow()
      expect(store.list()).toHaveLength(1)
    })
  })

  describe('lastUsed', () => {
    it('returns null before any value is set', () => {
      expect(store.getLastUsed()).toBeNull()
    })

    it('stores and retrieves layout and agent', () => {
      store.setLastUsed({ layout: 4, agent: 'claude-code' })
      expect(store.getLastUsed()).toEqual({ layout: 4, agent: 'claude-code' })
    })

    it('overwrites the previous value', () => {
      store.setLastUsed({ layout: 2, agent: 'claude-code' })
      store.setLastUsed({ layout: 6, agent: 'codex' })
      expect(store.getLastUsed()).toEqual({ layout: 6, agent: 'codex' })
    })
  })
})
