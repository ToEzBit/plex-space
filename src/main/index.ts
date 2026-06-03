import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  clipboard,
  nativeImage
} from 'electron'
import { join, basename } from 'path'
import { exec as cpExec, execFile } from 'child_process'
import { promisify } from 'util'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as pty from 'node-pty'

const execAsync = promisify(cpExec)
const execFileAsync = promisify(execFile)
const PATH_MARKER = '__PLEXPATH__'

async function fixProcessPath(): Promise<void> {
  if (process.platform !== 'darwin' && process.platform !== 'linux') return
  const userShell = process.env.SHELL || '/bin/zsh'
  try {
    const { stdout } = await execAsync(
      `${userShell} -ilc 'printf "${PATH_MARKER}%s${PATH_MARKER}" "$PATH"' 2>/dev/null`
    )
    const match = stdout.match(new RegExp(`${PATH_MARKER}(.+?)${PATH_MARKER}`))
    if (match?.[1]) process.env.PATH = match[1]
  } catch {
    // keep whatever PATH the OS provided
  }
}

async function openInVSCode(cwd: string): Promise<void> {
  try {
    await execFileAsync('open', ['-a', 'Visual Studio Code', cwd])
  } catch {
    await execFileAsync('code', [cwd])
  }
}
import { isInstalled } from './agentAvailability'
import {
  SpaceStore,
  JsonFileBackend,
  type Space,
  type LastUsed
} from './spaceStore'
import { SpacePool } from './spacePool'
import { TerminalRegistry } from './terminalRegistry'
import { worktreeContext, cleanupWorktree } from './worktree'
import { resolvePanes } from './resolvePanes'
import type { OpenGridResult } from '../shared/spaceRuntime'
import type {
  PaneWorktree,
  ManagedWorktree,
  KeptWorktree
} from '../shared/worktree'

let mainWindow: BrowserWindow | null = null

const registry = new TerminalRegistry({
  spawnPty: (file, args, options) => pty.spawn(file, args, options),
  shell: process.env.SHELL || '/bin/zsh',
  env: process.env as Record<string, string>,
  onData: (terminalId, data) =>
    mainWindow?.webContents.send('terminal:data', terminalId, data)
})
const spacePool = new SpacePool(registry)

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

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

app.whenReady().then(async () => {
  await fixProcessPath()
  electronApp.setAppUserModelId('com.plex-space')

  const store = new SpaceStore(
    new JsonFileBackend(join(app.getPath('userData'), 'spaces.json'))
  )

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('space:list', (): Space[] => store.list())
  ipcMain.handle(
    'space:create',
    (_, opts: { name?: string; directory: string }): Space => store.create(opts)
  )
  ipcMain.handle('space:remove', (_, id: string): void => store.remove(id))
  ipcMain.handle('space:getLastUsed', (): LastUsed | null =>
    store.getLastUsed()
  )
  ipcMain.handle('space:setLastUsed', (_, lastUsed: LastUsed): void =>
    store.setLastUsed(lastUsed)
  )

  ipcMain.handle(
    'system:which',
    async (_, command: string): Promise<boolean> => {
      return isInstalled(command)
    }
  )

  ipcMain.handle(
    'system:openInVSCode',
    async (_, cwd: string): Promise<void> => openInVSCode(cwd)
  )

  ipcMain.handle(
    'dialog:selectDirectory',
    async (): Promise<{ path: string; name: string } | null> => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      })
      if (result.canceled || result.filePaths.length === 0) return null
      const filePath = result.filePaths[0]
      const name = basename(filePath)
      return { path: filePath, name }
    }
  )

  ipcMain.handle(
    'space:worktreeContext',
    async (
      _,
      cwd: string
    ): Promise<{
      isRepo: boolean
      managed: ManagedWorktree[]
      branches: string[]
    }> => {
      const ctx = await worktreeContext(cwd)
      const openBranches = spacePool.openBranches()
      return {
        isRepo: ctx.isRepo,
        managed: ctx.managed.map((m) => ({
          ...m,
          inUse: openBranches.has(m.branch)
        })),
        branches: ctx.branches
      }
    }
  )

  ipcMain.handle(
    'space:openGrid',
    async (
      _,
      spaceId: string,
      cwd: string,
      layout: number,
      agentCommand: string,
      paneChoices: PaneWorktree[]
    ): Promise<OpenGridResult> => {
      // Already open → reattach to the existing Terminals; do no git work.
      if (spacePool.isOpen(spaceId)) return spacePool.open(spaceId, [])

      const panes = await resolvePanes(cwd, layout, agentCommand, paneChoices)
      return spacePool.open(spaceId, panes)
    }
  )

  ipcMain.handle(
    'space:closeGrid',
    async (_, spaceId: string, cwd: string): Promise<KeptWorktree[]> => {
      const worktrees = spacePool.close(spaceId)
      const kept: KeptWorktree[] = []
      for (const wt of worktrees) {
        try {
          const result = await cleanupWorktree(cwd, wt)
          if (result) kept.push(result)
        } catch {
          // Cleanup failed → keep it rather than lose track of the user's branch.
          kept.push({ branch: wt.branch, path: wt.path, reason: 'dirty' })
        }
      }
      return kept
    }
  )

  ipcMain.on('terminal:input', (_, terminalId: string, data: string) => {
    registry.input(terminalId, data)
  })

  ipcMain.on(
    'terminal:resize',
    (_, terminalId: string, cols: number, rows: number) => {
      registry.resize(terminalId, cols, rows)
    }
  )

  ipcMain.handle(
    'terminal:write-image-to-clipboard',
    (_, filePath: string): void => {
      const image = nativeImage.createFromPath(filePath)
      if (!image.isEmpty()) clipboard.writeImage(image)
    }
  )

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
