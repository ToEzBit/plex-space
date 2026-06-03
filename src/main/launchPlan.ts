export interface LaunchPlan {
  spawnFile: string
  spawnArgs: string[]
  /** The command to send into the shell, or null to leave the Pane at a bare shell prompt. */
  sendSequence: string | null
  sendDelayMs: number
}

export function buildLaunchPlan(shell: string, agentCommand: string | null): LaunchPlan {
  return {
    spawnFile: shell,
    spawnArgs: ['-l'],
    sendSequence: agentCommand ? agentCommand + '\r' : null,
    sendDelayMs: 300
  }
}
