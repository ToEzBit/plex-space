import { ElectronAPI } from '@electron-toolkit/preload'
import type { Layout } from '../shared/layout'
import type { OpenGridResult } from '../shared/spaceRuntime'
import type {
  PaneWorktree,
  ManagedWorktree,
  KeptWorktree
} from '../shared/worktree'

interface TerminalAPI {
  input: (terminalId: string, data: string) => void
  resize: (terminalId: string, cols: number, rows: number) => void
  onData: (handler: (terminalId: string, data: string) => void) => () => void
  getPathForFile: (file: File) => string
  writeImageToClipboard: (filePath: string) => Promise<void>
}

interface SpaceAPI {
  selectDirectory: () => Promise<{ path: string; name: string } | null>
  isInstalled: (command: string) => Promise<boolean>
  openInVSCode: (cwd: string) => Promise<void>
  listSpaces: () => Promise<Space[]>
  createSpace: (opts: { name?: string; directory: string }) => Promise<Space>
  removeSpace: (id: string) => Promise<void>
  getLastUsed: () => Promise<LastUsed | null>
  setLastUsed: (lastUsed: LastUsed) => Promise<void>
  worktreeContext: (cwd: string) => Promise<{
    isRepo: boolean
    managed: ManagedWorktree[]
    branches: string[]
  }>
  openGrid: (
    spaceId: string,
    cwd: string,
    layout: Layout,
    agentCommand: string,
    paneChoices: PaneWorktree[]
  ) => Promise<OpenGridResult>
  closeGrid: (spaceId: string, cwd: string) => Promise<KeptWorktree[]>
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
