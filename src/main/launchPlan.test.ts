import { describe, it, expect } from 'vitest'
import { buildLaunchPlan } from './launchPlan'

describe('buildLaunchPlan (Model 2)', () => {
  it('spawns the shell as a login shell', () => {
    const plan = buildLaunchPlan('/bin/zsh', 'claude')
    expect(plan.spawnFile).toBe('/bin/zsh')
    expect(plan.spawnArgs).toEqual(['-l'])
  })

  it('send sequence is the agent command followed by CR', () => {
    const plan = buildLaunchPlan('/bin/zsh', 'claude')
    expect(plan.sendSequence).toBe('claude\r')
  })

  it('works with any shell and any agent command', () => {
    const plan = buildLaunchPlan('/bin/bash', 'codex')
    expect(plan.spawnFile).toBe('/bin/bash')
    expect(plan.spawnArgs).toEqual(['-l'])
    expect(plan.sendSequence).toBe('codex\r')
  })

  it('send delay is a positive number of ms', () => {
    const plan = buildLaunchPlan('/bin/zsh', 'claude')
    expect(plan.sendDelayMs).toBeGreaterThan(0)
  })
})
