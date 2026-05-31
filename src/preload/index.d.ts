import { ElectronAPI } from '@electron-toolkit/preload'
import type { Layout } from '../shared/layout'

interface TerminalAPI {
  create: (terminalId: string, cwd: string, agentCommand: string) => Promise<void>
  input: (terminalId: string, data: string) => void
  resize: (terminalId: string, cols: number, rows: number) => void
  destroy: (terminalId: string) => void
  onData: (handler: (terminalId: string, data: string) => void) => () => void
}

interface SpaceAPI {
  selectDirectory: () => Promise<{ path: string; name: string } | null>
  isInstalled: (command: string) => Promise<boolean>
  listSpaces: () => Promise<Space[]>
  createSpace: (opts: { name?: string; directory: string }) => Promise<Space>
  removeSpace: (id: string) => Promise<void>
  getLastUsed: () => Promise<LastUsed | null>
  setLastUsed: (lastUsed: LastUsed) => Promise<void>
}

declare global {
  interface Space {
    id: string
    name: string
    directory: string
  }
  interface LastUsed {
    layout: Layout
    agent: string
  }
  interface Window {
    electron: ElectronAPI
    terminalAPI: TerminalAPI
    spaceAPI: SpaceAPI
  }
}
