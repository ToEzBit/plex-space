import { describe, it, expect, vi } from 'vitest'
import { isInstalled } from './agentAvailability'

describe('isInstalled', () => {
  it('returns true when command -v resolves', async () => {
    const fakeExec = vi.fn().mockResolvedValue({ stdout: '/usr/local/bin/claude' })
    expect(await isInstalled('claude', fakeExec)).toBe(true)
    expect(fakeExec).toHaveBeenCalledWith('command -v claude')
  })

  it('returns false when command -v rejects (not on PATH)', async () => {
    const fakeExec = vi.fn().mockRejectedValue(new Error('not found'))
    expect(await isInstalled('codex', fakeExec)).toBe(false)
    expect(fakeExec).toHaveBeenCalledWith('command -v codex')
  })

  it('passes the command name into the command -v call', async () => {
    const fakeExec = vi.fn().mockResolvedValue({})
    await isInstalled('my-tool', fakeExec)
    expect(fakeExec).toHaveBeenCalledWith('command -v my-tool')
  })

  it('returns false and skips exec for commands with unsafe characters', async () => {
    const fakeExec = vi.fn()
    expect(await isInstalled('rm -rf /', fakeExec)).toBe(false)
    expect(fakeExec).not.toHaveBeenCalled()
  })
})
