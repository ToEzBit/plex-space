import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, basename } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as pty from 'node-pty'
import { buildLaunchPlan } from './launchPlan'
import { isInstalled } from './agentAvailability'
import { SpaceStore, JsonFileBackend, type Space, type LastUsed } from './spaceStore'
import { SpacePool, type TerminalSpawner } from './spacePool'

interface TerminalEntry {
  pty: pty.IPty
  sendTimer?: ReturnType<typeof setTimeout>
}

const terminals = new Map<string, TerminalEntry>()
let mainWindow: BrowserWindow | null = null

function spawnPty(terminalId: string, cwd: string, agentCommand: string): void {
  const shell = process.env.SHELL || '/bin/zsh'
  const plan = buildLaunchPlan(shell, agentCommand)

  const ptyProcess = pty.spawn(plan.spawnFile, plan.spawnArgs, {
    name: 'xterm-256color',
    cwd,
    env: process.env as Record<string, string>,
    cols: 80,
    rows: 24
  })

  ptyProcess.onData((data) => {
    mainWindow?.webContents.send('terminal:data', terminalId, data)
  })

  const sendTimer = setTimeout(() => {
    ptyProcess.write(plan.sendSequence)
  }, plan.sendDelayMs)

  terminals.set(terminalId, { pty: ptyProcess, sendTimer })
}

function killPty(terminalId: string): void {
  const entry = terminals.get(terminalId)
  if (entry) {
    clearTimeout(entry.sendTimer)
    entry.pty.kill()
    terminals.delete(terminalId)
  }
}

const ptySpawner: TerminalSpawner = { spawn: spawnPty, kill: killPty }
const spacePool = new SpacePool(ptySpawner)

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.plex-space')

  const store = new SpaceStore(new JsonFileBackend(join(app.getPath('userData'), 'spaces.json')))

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('space:list', (): Space[] => store.list())
  ipcMain.handle('space:create', (_, opts: { name?: string; directory: string }): Space =>
    store.create(opts)
  )
  ipcMain.handle('space:remove', (_, id: string): void => store.remove(id))
  ipcMain.handle('space:getLastUsed', (): LastUsed | null => store.getLastUsed())
  ipcMain.handle('space:setLastUsed', (_, lastUsed: LastUsed): void =>
    store.setLastUsed(lastUsed)
  )

  ipcMain.handle('system:which', async (_, command: string): Promise<boolean> => {
    return isInstalled(command)
  })

  ipcMain.handle(
    'dialog:selectDirectory',
    async (): Promise<{ path: string; name: string } | null> => {
      const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
      if (result.canceled || result.filePaths.length === 0) return null
      const filePath = result.filePaths[0]
      const name = basename(filePath)
      return { path: filePath, name }
    }
  )

  ipcMain.handle(
    'space:openGrid',
    (
      _,
      spaceId: string,
      cwd: string,
      layout: number,
      agentCommand: string
    ): { terminalIds: string[]; isNew: boolean } => {
      return spacePool.open(spaceId, cwd, layout, agentCommand)
    }
  )

  ipcMain.handle('space:closeGrid', (_, spaceId: string): void => {
    spacePool.close(spaceId)
  })

  ipcMain.on('terminal:input', (_, terminalId: string, data: string) => {
    terminals.get(terminalId)?.pty.write(data)
  })

  ipcMain.on('terminal:resize', (_, terminalId: string, cols: number, rows: number) => {
    terminals.get(terminalId)?.pty.resize(cols, rows)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  spacePool.closeAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
