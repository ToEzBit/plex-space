import { promisify } from 'util'
import { exec as cpExec } from 'child_process'

const execAsync = promisify(cpExec)
const SAFE_COMMAND = /^[a-z0-9_-]+$/i

export async function isInstalled(
  command: string,
  exec: (cmd: string) => Promise<unknown> = execAsync
): Promise<boolean> {
  if (!SAFE_COMMAND.test(command)) return false
  try {
    await exec(`command -v ${command}`)
    return true
  } catch {
    return false
  }
}
