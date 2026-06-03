import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TerminalRegistry, type Pty, type PtyOptions } from './terminalRegistry'

class FakePty implements Pty {
  written: string[] = []
  resized: Array<{ cols: number; rows: number }> = []
  killed = false
  private dataCb: ((data: string) => void) | null = null

  onData(cb: (data: string) => void): void {
    this.dataCb = cb
  }
  write(data: string): void {
    this.written.push(data)
  }
  resize(cols: number, rows: number): void {
    this.resized.push({ cols, rows })
  }
  kill(): void {
    this.killed = true
  }

  /** Test-only: simulate the pty emitting output. */
  emit(data: string): void {
    this.dataCb?.(data)
  }
}

function setup(): {
  registry: TerminalRegistry
  spawned: Array<{
    file: string
    args: string[]
    options: PtyOptions
    pty: FakePty
  }>
  onData: ReturnType<typeof vi.fn>
  env: Record<string, string>
} {
  const spawned: Array<{
    file: string
    args: string[]
    options: PtyOptions
    pty: FakePty
  }> = []
  const onData = vi.fn()
  const env = { PATH: '/usr/bin', HOME: '/home/u' }
  const registry = new TerminalRegistry({
    spawnPty: (file, args, options) => {
      const pty = new FakePty()
      spawned.push({ file, args, options, pty })
      return pty
    },
    shell: '/bin/zsh',
    env,
    onData
  })
  return { registry, spawned, onData, env }
}

describe('TerminalRegistry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('spawn', () => {
    it('creates a pty with the injected shell, plan args, cwd and env', () => {
      const { registry, spawned, env } = setup()
      registry.spawn('t1', { cwd: '/project', agentCommand: 'claude' })
      expect(spawned).toHaveLength(1)
      expect(spawned[0].file).toBe('/bin/zsh')
      expect(spawned[0].args).toEqual(['-l'])
      expect(spawned[0].options.cwd).toBe('/project')
      expect(spawned[0].options.env).toBe(env)
      expect(spawned[0].options.name).toBe('xterm-256color')
    })

    it('routes pty output to the onData sink with the terminal id', () => {
      const { registry, spawned, onData } = setup()
      registry.spawn('t1', { cwd: '/project', agentCommand: 'claude' })
      spawned[0].pty.emit('hello world')
      expect(onData).toHaveBeenCalledWith('t1', 'hello world')
    })

    it('writes the send sequence into the pty after the send delay', () => {
      const { registry, spawned } = setup()
      registry.spawn('t1', { cwd: '/project', agentCommand: 'claude' })
      expect(spawned[0].pty.written).toEqual([]) // not yet
      vi.advanceTimersByTime(300)
      expect(spawned[0].pty.written).toEqual(['claude\r'])
    })

    it('does not send anything when agentCommand is null (bare shell)', () => {
      const { registry, spawned } = setup()
      registry.spawn('t1', { cwd: '/project', agentCommand: null })
      vi.advanceTimersByTime(300)
      expect(spawned[0].pty.written).toEqual([])
    })

    it('emits a notice to the data sink — not into the pty (would be executed as a command)', () => {
      const { registry, spawned, onData } = setup()
      registry.spawn('t1', {
        cwd: '/project',
        agentCommand: null,
        notice: 'worktree failed\r\n'
      })
      expect(onData).toHaveBeenCalledWith('t1', 'worktree failed\r\n')
      expect(spawned[0].pty.written).toEqual([]) // never written to stdin
    })
  })

  describe('kill', () => {
    it('cancels a pending send sequence when killed before the delay fires', () => {
      const { registry, spawned } = setup()
      registry.spawn('t1', { cwd: '/project', agentCommand: 'claude' })
      const pty = spawned[0].pty
      registry.kill('t1')
      vi.advanceTimersByTime(300)
      expect(pty.written).toEqual([]) // clearTimeout held
    })

    it('kills the pty and removes it from the registry', () => {
      const { registry, spawned } = setup()
      registry.spawn('t1', { cwd: '/project', agentCommand: 'claude' })
      const pty = spawned[0].pty
      registry.kill('t1')
      expect(pty.killed).toBe(true)
      // entry gone: subsequent input is a no-op (does not reach the dead pty)
      registry.input('t1', 'x')
      expect(pty.written).toEqual([])
    })

    it('is a no-op for an unknown terminal id', () => {
      const { registry } = setup()
      expect(() => registry.kill('nope')).not.toThrow()
    })
  })

  describe('input', () => {
    it('writes to the matching pty', () => {
      const { registry, spawned } = setup()
      registry.spawn('t1', { cwd: '/a', agentCommand: 'claude' })
      registry.spawn('t2', { cwd: '/b', agentCommand: 'claude' })
      registry.input('t2', 'ls\r')
      expect(spawned[1].pty.written).toContain('ls\r')
      expect(spawned[0].pty.written).not.toContain('ls\r')
    })

    it('is a no-op for an unknown terminal id', () => {
      const { registry } = setup()
      expect(() => registry.input('nope', 'x')).not.toThrow()
    })
  })

  describe('resize', () => {
    it('resizes the matching pty', () => {
      const { registry, spawned } = setup()
      registry.spawn('t1', { cwd: '/a', agentCommand: 'claude' })
      registry.resize('t1', 120, 40)
      expect(spawned[0].pty.resized).toEqual([{ cols: 120, rows: 40 }])
    })

    it('is a no-op for an unknown terminal id', () => {
      const { registry } = setup()
      expect(() => registry.resize('nope', 80, 24)).not.toThrow()
    })
  })
})
