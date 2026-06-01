import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Layout } from '../shared/layout'

const terminalAPI = {
  input: (terminalId: string, data: string): void =>
    ipcRenderer.send('terminal:input', terminalId, data),
  resize: (terminalId: string, cols: number, rows: number): void =>
    ipcRenderer.send('terminal:resize', terminalId, cols, rows),
  onData: (handler: (terminalId: string, data: string) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, terminalId: string, data: string): void =>
      handler(terminalId, data)
    ipcRenderer.on('terminal:data', listener)
    return () => ipcRenderer.off('terminal:data', listener)
  },
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),
  writeImageToClipboard: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('terminal:write-image-to-clipboard', filePath)
}

const spaceAPI = {
  selectDirectory: (): Promise<{ path: string; name: string } | null> =>
    ipcRenderer.invoke('dialog:selectDirectory'),
  isInstalled: (command: string): Promise<boolean> => ipcRenderer.invoke('system:which', command),
  listSpaces: (): Promise<{ id: string; name: string; directory: string }[]> =>
    ipcRenderer.invoke('space:list'),
  createSpace: (opts: {
    name?: string
    directory: string
  }): Promise<{ id: string; name: string; directory: string }> =>
    ipcRenderer.invoke('space:create', opts),
  removeSpace: (id: string): Promise<void> => ipcRenderer.invoke('space:remove', id),
  getLastUsed: (): Promise<{ layout: Layout; agent: string } | null> =>
    ipcRenderer.invoke('space:getLastUsed'),
  setLastUsed: (lastUsed: { layout: Layout; agent: string }): Promise<void> =>
    ipcRenderer.invoke('space:setLastUsed', lastUsed),
  openGrid: (
    spaceId: string,
    cwd: string,
    layout: Layout,
    agentCommand: string
  ): Promise<{ terminalIds: string[]; isNew: boolean }> =>
    ipcRenderer.invoke('space:openGrid', spaceId, cwd, layout, agentCommand),
  closeGrid: (spaceId: string): Promise<void> => ipcRenderer.invoke('space:closeGrid', spaceId)
}

try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('terminalAPI', terminalAPI)
  contextBridge.exposeInMainWorld('spaceAPI', spaceAPI)
} catch (error) {
  console.error(error)
}
