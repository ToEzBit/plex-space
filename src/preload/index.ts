import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const terminalAPI = {
  create: (terminalId: string, cwd: string, agentCommand: string): Promise<void> =>
    ipcRenderer.invoke('terminal:create', terminalId, cwd, agentCommand),
  input: (terminalId: string, data: string): void =>
    ipcRenderer.send('terminal:input', terminalId, data),
  resize: (terminalId: string, cols: number, rows: number): void =>
    ipcRenderer.send('terminal:resize', terminalId, cols, rows),
  destroy: (terminalId: string): void => ipcRenderer.send('terminal:destroy', terminalId),
  onData: (handler: (terminalId: string, data: string) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, terminalId: string, data: string): void =>
      handler(terminalId, data)
    ipcRenderer.on('terminal:data', listener)
    return () => ipcRenderer.off('terminal:data', listener)
  }
}

const spaceAPI = {
  selectDirectory: (): Promise<{ path: string; name: string } | null> =>
    ipcRenderer.invoke('dialog:selectDirectory')
}

try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('terminalAPI', terminalAPI)
  contextBridge.exposeInMainWorld('spaceAPI', spaceAPI)
} catch (error) {
  console.error(error)
}
