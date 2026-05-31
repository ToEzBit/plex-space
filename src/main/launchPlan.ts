export interface LaunchPlan {
  spawnFile: string
  spawnArgs: string[]
  sendSequence: string
  sendDelayMs: number
}

export function buildLaunchPlan(shell: string, agentCommand: string): LaunchPlan {
  return {
    spawnFile: shell,
    spawnArgs: [],
    sendSequence: agentCommand + '\r',
    sendDelayMs: 300
  }
}
