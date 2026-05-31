import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as pty from 'node-pty'
import os from 'os'
import { buildLaunchPlan } from './launchPlan'

interface TerminalEntry {
  pty: pty.IPty
  sendTimer?: ReturnType<typeof setTimeout>
  spaceId?: string
}

const terminals = new Map<string, TerminalEntry>()

function createWindow(): void {
  const mainWindow = new BrowserWindow({
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

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('terminal:create', (event, terminalId: string) => {
    const shell = process.env.SHELL || '/bin/zsh'
    const plan = buildLaunchPlan(shell, 'claude')

    const ptyProcess = pty.spawn(plan.spawnFile, plan.spawnArgs, {
      name: 'xterm-256color',
      cwd: os.homedir(),
      env: process.env as Record<string, string>,
      cols: 80,
      rows: 24
    })

    const win = BrowserWindow.fromWebContents(event.sender)
    ptyProcess.onData((data) => {
      win?.webContents.send('terminal:data', terminalId, data)
    })

    const sendTimer = setTimeout(() => {
      ptyProcess.write(plan.sendSequence)
    }, plan.sendDelayMs)

    terminals.set(terminalId, { pty: ptyProcess, sendTimer })
  })

  ipcMain.on('terminal:input', (_, terminalId: string, data: string) => {
    terminals.get(terminalId)?.pty.write(data)
  })

  ipcMain.on('terminal:resize', (_, terminalId: string, cols: number, rows: number) => {
    terminals.get(terminalId)?.pty.resize(cols, rows)
  })

  ipcMain.on('terminal:destroy', (_, terminalId: string) => {
    const entry = terminals.get(terminalId)
    if (entry) {
      clearTimeout(entry.sendTimer)
      entry.pty.kill()
      terminals.delete(terminalId)
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
