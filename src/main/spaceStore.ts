import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export type Layout = 1 | 2 | 4 | 6
export type Agent = string

export interface Space {
  id: string
  name: string
  directory: string
}

export interface LastUsed {
  layout: Layout
  agent: Agent
}

export interface StorageBackend {
  loadSpaces(): Space[]
  saveSpaces(spaces: Space[]): void
  loadLastUsed(): LastUsed | null
  saveLastUsed(lastUsed: LastUsed): void
}

export class MemoryBackend implements StorageBackend {
  private spaces: Space[] = []
  private lastUsed: LastUsed | null = null

  loadSpaces(): Space[] {
    return this.spaces
  }

  saveSpaces(spaces: Space[]): void {
    this.spaces = spaces
  }

  loadLastUsed(): LastUsed | null {
    return this.lastUsed
  }

  saveLastUsed(lastUsed: LastUsed): void {
    this.lastUsed = lastUsed
  }
}

interface StoreData {
  spaces: Space[]
  lastUsed: LastUsed | null
}

export class JsonFileBackend implements StorageBackend {
  constructor(private filePath: string) {}

  private read(): StoreData {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as StoreData
    } catch {
      return { spaces: [], lastUsed: null }
    }
  }

  private write(data: StoreData): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true })
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  private update(patch: Partial<StoreData>): void {
    this.write({ ...this.read(), ...patch })
  }

  loadSpaces(): Space[] {
    return this.read().spaces
  }

  saveSpaces(spaces: Space[]): void {
    this.update({ spaces })
  }

  loadLastUsed(): LastUsed | null {
    return this.read().lastUsed
  }

  saveLastUsed(lastUsed: LastUsed): void {
    this.update({ lastUsed })
  }
}

export class SpaceStore {
  constructor(private backend: StorageBackend) {}

  create(opts: { name?: string; directory: string }): Space {
    const name = opts.name?.trim() || path.basename(opts.directory)
    const space: Space = {
      id: crypto.randomUUID(),
      name,
      directory: opts.directory
    }
    const spaces = this.backend.loadSpaces()
    spaces.push(space)
    this.backend.saveSpaces(spaces)
    return space
  }

  list(): Space[] {
    return this.backend.loadSpaces()
  }

  remove(id: string): void {
    this.backend.saveSpaces(this.backend.loadSpaces().filter((s) => s.id !== id))
  }

  getLastUsed(): LastUsed | null {
    return this.backend.loadLastUsed()
  }

  setLastUsed(lastUsed: LastUsed): void {
    this.backend.saveLastUsed(lastUsed)
  }
}
