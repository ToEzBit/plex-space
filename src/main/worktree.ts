import { execFile } from 'child_process'
import { promisify } from 'util'
import { join, resolve, dirname } from 'path'
import { readFile, appendFile, mkdir, stat } from 'fs/promises'
import type { ManagedWorktree, KeptWorktree } from '../shared/worktree'

const execFileAsync = promisify(execFile)

/**
 * Runs git with an argument array — never a shell string — so user-typed branch names
 * cannot be interpreted by the shell. See docs/adr/0009-per-pane-git-worktrees.md.
 */
export interface GitRunner {
  (args: string[], cwd: string): Promise<{ stdout: string; stderr: string }>
}

export const realGit: GitRunner = async (args, cwd) => {
  const { stdout, stderr } = await execFileAsync('git', args, { cwd })
  return { stdout: stdout.toString(), stderr: stderr.toString() }
}

/** Where Plex-managed worktrees live, relative to the repo root. */
const MANAGED_SUBPATH = ['.plex-space', 'worktrees']
const EXCLUDE_LINE = '.plex-space/'

export async function isGitRepo(cwd: string, run: GitRunner = realGit): Promise<boolean> {
  try {
    const { stdout } = await run(['rev-parse', '--is-inside-work-tree'], cwd)
    return stdout.trim() === 'true'
  } catch {
    return false
  }
}

async function repoRoot(cwd: string, run: GitRunner): Promise<string> {
  const { stdout } = await run(['rev-parse', '--show-toplevel'], cwd)
  return stdout.trim()
}

function managedDir(root: string): string {
  return join(root, ...MANAGED_SUBPATH)
}

function worktreePathFor(root: string, branch: string): string {
  return join(managedDir(root), branch)
}

/**
 * Validates a branch name with git's own rules. The single gate between user input and
 * any other git command — reject here before the name is ever passed to `worktree add`.
 */
export async function isValidBranchName(
  cwd: string,
  branch: string,
  run: GitRunner = realGit
): Promise<boolean> {
  if (branch.length === 0) return false
  try {
    await run(['check-ref-format', '--branch', branch], cwd)
    return true
  } catch {
    return false
  }
}

async function localBranches(root: string, run: GitRunner): Promise<string[]> {
  const { stdout } = await run(['for-each-ref', '--format=%(refname:short)', 'refs/heads'], root)
  return stdout
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

/** Appends `.plex-space/` to the repo's local exclude file (idempotent), so worktrees never dirty `git status`. */
async function ensureExcluded(cwd: string, run: GitRunner): Promise<void> {
  const { stdout } = await run(['rev-parse', '--git-common-dir'], cwd)
  // --git-common-dir is relative to cwd in the main worktree, absolute in a linked one.
  const excludePath = join(resolve(cwd, stdout.trim()), 'info', 'exclude')
  let current = ''
  try {
    current = await readFile(excludePath, 'utf8')
  } catch {
    // no exclude file yet — appendFile will create it
  }
  const present = current.split('\n').some((l) => l.trim() === EXCLUDE_LINE)
  if (!present) {
    const prefix = current.length > 0 && !current.endsWith('\n') ? '\n' : ''
    await appendFile(excludePath, `${prefix}${EXCLUDE_LINE}\n`)
  }
}

/** Parses `git worktree list --porcelain` into [{ branch, path }], keeping only Plex-managed ones. */
async function listManagedRefs(
  root: string,
  run: GitRunner
): Promise<Array<{ branch: string; path: string }>> {
  const { stdout } = await run(['worktree', 'list', '--porcelain'], root)
  const managed = managedDir(root)
  const out: Array<{ branch: string; path: string }> = []
  let path: string | null = null
  for (const line of stdout.split('\n')) {
    if (line.startsWith('worktree ')) {
      path = line.slice('worktree '.length).trim()
    } else if (line.startsWith('branch ') && path) {
      const branch = line
        .slice('branch '.length)
        .trim()
        .replace(/^refs\/heads\//, '')
      if (path === managed || path.startsWith(managed + '/')) out.push({ branch, path })
    } else if (line === '') {
      path = null
    }
  }
  return out
}

async function worktreeState(path: string, run: GitRunner): Promise<'clean' | 'dirty'> {
  try {
    const { stdout } = await run(['status', '--porcelain'], path)
    return stdout.trim() === '' ? 'clean' : 'dirty'
  } catch {
    // If the path is gone/unreadable, treat as dirty so we never silently force-remove.
    return 'dirty'
  }
}

/**
 * Context for the wizard's worktree step: managed worktrees (for the resume picker, without the
 * cross-Space `inUse` flag, which the caller fills from the live pool) and existing branch names
 * (so default names can avoid colliding with — and silently hijacking — an unrelated branch).
 */
export async function worktreeContext(
  cwd: string,
  run: GitRunner = realGit
): Promise<{
  isRepo: boolean
  managed: Omit<ManagedWorktree, 'inUse'>[]
  branches: string[]
}> {
  if (!(await isGitRepo(cwd, run))) return { isRepo: false, managed: [], branches: [] }
  const root = await repoRoot(cwd, run)
  const [managed, branches] = await Promise.all([
    listManagedRefs(root, run).then((refs) =>
      Promise.all(refs.map(async (r) => ({ ...r, state: await worktreeState(r.path, run) })))
    ),
    localBranches(root, run)
  ])
  return { isRepo: true, managed, branches }
}

/** Validates the branch name, resolves the repo root, and ensures `.plex-space/` is git-ignored. */
async function preflight(cwd: string, branch: string, run: GitRunner): Promise<string> {
  if (!(await isValidBranchName(cwd, branch, run))) {
    throw new Error(`Invalid branch name: ${branch}`)
  }
  const root = await repoRoot(cwd, run)
  await ensureExcluded(cwd, run)
  return root
}

/** Creates a new worktree on a new branch off HEAD; returns its path. Throws on failure. */
export async function createWorktree(
  cwd: string,
  branch: string,
  run: GitRunner = realGit
): Promise<string> {
  const root = await preflight(cwd, branch, run)
  const path = worktreePathFor(root, branch)
  await run(['worktree', 'add', '-b', branch, path, 'HEAD'], root)
  // Best-effort: a fresh worktree only has tracked files. Bring over gitignored essentials
  // (.env, node_modules, …) listed in .worktreeinclude so the Agent can build/run. Never throws.
  try {
    await populateWorktree(root, path)
  } catch {
    // ignore — the worktree is usable without the includes
  }
  return path
}

/**
 * Copies the paths listed in `<repo>/.worktreeinclude` into a freshly created worktree.
 *
 * Uses APFS clonefile (`cp -c`): copy-on-write, so a 1.5GB node_modules clones instantly and uses
 * no extra disk until written — yet each worktree stays isolated (an Agent's `npm install` does not
 * leak to the main repo or sibling worktrees). macOS-only (ADR-0005) and the worktree lives under
 * the repo, so source and destination are always on the same APFS volume. Returns the paths brought
 * over. Best-effort per entry: a missing source or failed clone is skipped, not fatal.
 */
export async function populateWorktree(
  root: string,
  worktreePath: string,
  clone: (src: string, dst: string) => Promise<void> = realClone
): Promise<string[]> {
  let content: string
  try {
    content = await readFile(join(root, '.worktreeinclude'), 'utf8')
  } catch {
    return [] // no .worktreeinclude → nothing to bring over
  }
  const patterns = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'))

  const included: string[] = []
  for (const pattern of patterns) {
    // Stay inside the repo: ignore absolute paths and parent-escaping patterns.
    if (pattern.startsWith('/') || pattern.split('/').includes('..')) continue
    const src = join(root, pattern)
    const dst = join(worktreePath, pattern)
    // Only bring over what's missing — a tracked path is already in the checkout; don't overwrite it.
    if (!(await pathExists(src)) || (await pathExists(dst))) continue
    try {
      await mkdir(dirname(dst), { recursive: true })
      await clone(src, dst)
      included.push(pattern)
    } catch {
      // best-effort — skip this entry
    }
  }
  return included
}

const realClone = async (src: string, dst: string): Promise<void> => {
  await execFileAsync('cp', ['-c', '-R', src, dst]) // -c = APFS clonefile (copy-on-write)
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

/** Reattaches to an existing branch: reuses its worktree if one exists, else creates one. Returns the path. */
export async function resumeWorktree(
  cwd: string,
  branch: string,
  run: GitRunner = realGit
): Promise<string> {
  const root = await preflight(cwd, branch, run)
  const existing = (await listManagedRefs(root, run)).find((r) => r.branch === branch)
  if (existing) return existing.path
  const path = worktreePathFor(root, branch)
  await run(['worktree', 'add', path, branch], root)
  return path
}

/**
 * Close-time cleanup for one managed worktree (discard-experiments model):
 * dirty → keep + report; clean → remove the worktree directory AND force-delete the branch.
 * Returns a KeptWorktree if it was kept, or null if it was removed.
 */
export async function cleanupWorktree(
  cwd: string,
  wt: { branch: string; path: string },
  run: GitRunner = realGit
): Promise<KeptWorktree | null> {
  if ((await worktreeState(wt.path, run)) === 'dirty') {
    return { branch: wt.branch, path: wt.path, reason: 'dirty' }
  }
  const root = await repoRoot(cwd, run)
  await run(['worktree', 'remove', wt.path], root) // refuses if not clean; we checked
  await run(['branch', '-D', wt.branch], root) // force-delete: see ADR-0009 (eyes-open data-loss)
  return null
}
