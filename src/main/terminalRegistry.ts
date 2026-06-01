import { buildLaunchPlan } from './launchPlan'
import type { TerminalSpawner } from './spacePool'

/** The slice of a pty the registry actually drives. node-pty's IPty satisfies it structurally. */
export interface Pty {
  onData(cb: (data: string) => void): void
  write(data: string): void
  resize(cols: number, rows: number): void
  kill(): void
}

export interface PtyOptions {
  name: string
  cwd: string
  env: Record<string, string>
  cols: number
  rows: number
}

/** Internal seam: real adapter calls node-pty; tests pass a fake. */
export type PtyFactory = (file: string, args: string[], options: PtyOptions) => Pty

export interface TerminalRegistryDeps {
  spawnPty: PtyFactory
  shell: string
  env: Record<string, string>
  onData: (terminalId: string, data: string) => void
}

interface Entry {
  pty: Pty
  sendTimer: ReturnType<typeof setTimeout>
}

export class TerminalRegistry implements TerminalSpawner {
  private terminals = new Map<string, Entry>()

  constructor(private deps: TerminalRegistryDeps) {}

  spawn(terminalId: string, cwd: string, agentCommand: string): void {
    const plan = buildLaunchPlan(this.deps.shell, agentCommand)
    const pty = this.deps.spawnPty(plan.spawnFile, plan.spawnArgs, {
      name: 'xterm-256color',
      cwd,
      env: this.deps.env,
      cols: 80,
      rows: 24
    })

    pty.onData((data) => this.deps.onData(terminalId, data))

    const sendTimer = setTimeout(() => {
      pty.write(plan.sendSequence)
    }, plan.sendDelayMs)

    this.terminals.set(terminalId, { pty, sendTimer })
  }

  kill(terminalId: string): void {
    const entry = this.terminals.get(terminalId)
    if (!entry) return
    clearTimeout(entry.sendTimer)
    entry.pty.kill()
    this.terminals.delete(terminalId)
  }

  input(terminalId: string, data: string): void {
    this.terminals.get(terminalId)?.pty.write(data)
  }

  resize(terminalId: string, cols: number, rows: number): void {
    this.terminals.get(terminalId)?.pty.resize(cols, rows)
  }
}
