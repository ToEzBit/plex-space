import { ElectronAPI } from '@electron-toolkit/preload'

interface TerminalAPI {
  create: (terminalId: string) => Promise<void>
  input: (terminalId: string, data: string) => void
  resize: (terminalId: string, cols: number, rows: number) => void
  destroy: (terminalId: string) => void
  onData: (handler: (terminalId: string, data: string) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    terminalAPI: TerminalAPI
  }
}
