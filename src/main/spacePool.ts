export interface TerminalSpawner {
  spawn(terminalId: string, cwd: string, agentCommand: string): void
  kill(terminalId: string): void
}

export interface OpenSpaceEntry {
  cwd: string
  layout: number
  agentCommand: string
  terminalIds: string[]
}

export class SpacePool {
  private pool = new Map<string, OpenSpaceEntry>()

  constructor(private spawner: TerminalSpawner) {}

  open(
    spaceId: string,
    cwd: string,
    layout: number,
    agentCommand: string
  ): { terminalIds: string[]; isNew: boolean } {
    const existing = this.pool.get(spaceId)
    if (existing) {
      return { terminalIds: existing.terminalIds, isNew: false }
    }

    const terminalIds = Array.from({ length: layout }, (_, i) => `${spaceId}:${i}`)
    for (const terminalId of terminalIds) {
      this.spawner.spawn(terminalId, cwd, agentCommand)
    }

    this.pool.set(spaceId, { cwd, layout, agentCommand, terminalIds })
    return { terminalIds, isNew: true }
  }

  close(spaceId: string): void {
    const entry = this.pool.get(spaceId)
    if (!entry) return
    for (const terminalId of entry.terminalIds) {
      this.spawner.kill(terminalId)
    }
    this.pool.delete(spaceId)
  }

  closeAll(): void {
    for (const spaceId of Array.from(this.pool.keys())) {
      this.close(spaceId)
    }
  }

  isOpen(spaceId: string): boolean {
    return this.pool.has(spaceId)
  }

  openIds(): string[] {
    return Array.from(this.pool.keys())
  }
}
