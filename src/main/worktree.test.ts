import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, rm, writeFile, readFile, stat } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  realGit,
  isGitRepo,
  isValidBranchName,
  worktreeContext,
  createWorktree,
  resumeWorktree,
  cleanupWorktree,
  populateWorktree,
  type GitRunner
} from './worktree'

// ── Unit tests: parsing/filtering with a fake runner (no real git, no fs) ──────────────

/** A fake GitRunner that dispatches on the joined argument string. */
function fakeRunner(handlers: Record<string, string>): GitRunner & { calls: string[][] } {
  const calls: string[][] = []
  const run: GitRunner = async (args) => {
    calls.push(args)
    const key = args.join(' ')
    const match = Object.keys(handlers).find((k) => key.startsWith(k))
    if (match === undefined) throw new Error(`unexpected git: ${key}`)
    return { stdout: handlers[match], stderr: '' }
  }
  return Object.assign(run, { calls })
}

describe('worktreeContext', () => {
  it('reports not-a-repo without crashing', async () => {
    const run = (async () => {
      throw new Error('not a git repo')
    }) as GitRunner
    expect(await worktreeContext('/tmp/x', run)).toEqual({
      isRepo: false,
      managed: [],
      branches: []
    })
  })

  it('keeps only Plex-managed worktrees and tags each with its state', async () => {
    const porcelain = [
      'worktree /repo',
      'HEAD aaa',
      'branch refs/heads/main',
      '',
      'worktree /repo/.plex-space/worktrees/feat-a',
      'HEAD bbb',
      'branch refs/heads/feat-a',
      '',
      'worktree /elsewhere/manual',
      'HEAD ccc',
      'branch refs/heads/manual',
      ''
    ].join('\n')
    const run = fakeRunner({
      'rev-parse --is-inside-work-tree': 'true\n',
      'rev-parse --show-toplevel': '/repo\n',
      'worktree list --porcelain': porcelain,
      'status --porcelain': 'M file.ts\n', // feat-a is dirty
      'for-each-ref': 'main\nfeat-a\n'
    })
    const ctx = await worktreeContext('/repo', run)
    expect(ctx.isRepo).toBe(true)
    expect(ctx.managed).toEqual([
      {
        branch: 'feat-a',
        path: '/repo/.plex-space/worktrees/feat-a',
        state: 'dirty'
      }
    ])
    expect(ctx.branches).toEqual(['main', 'feat-a'])
  })
})

describe('isValidBranchName', () => {
  it('rejects empty without calling git', async () => {
    const run = fakeRunner({})
    expect(await isValidBranchName('/repo', '', run)).toBe(false)
    expect(run.calls).toHaveLength(0)
  })
})

// ── Integration tests: real git in a throwaway repo (lifecycle round-trip) ──────────────

describe('worktree lifecycle (real git)', () => {
  let repo: string

  beforeAll(async () => {
    repo = await mkdtemp(join(tmpdir(), 'plex-wt-'))
    await realGit(['init', '-b', 'main'], repo)
    await realGit(['config', 'user.email', 'test@example.com'], repo)
    await realGit(['config', 'user.name', 'Test'], repo)
    await writeFile(join(repo, 'README.md'), '# test\n')
    await realGit(['add', '.'], repo)
    await realGit(['commit', '-m', 'initial'], repo)
  })

  afterAll(async () => {
    await rm(repo, { recursive: true, force: true })
  })

  async function exists(p: string): Promise<boolean> {
    try {
      await stat(p)
      return true
    } catch {
      return false
    }
  }
  async function branchExists(branch: string): Promise<boolean> {
    try {
      await realGit(['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], repo)
      return true
    } catch {
      return false
    }
  }

  it('isGitRepo is true for the repo, false for a bare temp dir', async () => {
    expect(await isGitRepo(repo)).toBe(true)
    const plain = await mkdtemp(join(tmpdir(), 'plex-plain-'))
    expect(await isGitRepo(plain)).toBe(false)
    await rm(plain, { recursive: true, force: true })
  })

  it('createWorktree makes a branch + dir and keeps git status clean (exclude works)', async () => {
    const path = await createWorktree(repo, 'feat-a')
    // path is built from git's resolved repo root (canonical; /tmp → /private/tmp on macOS)
    expect(path.endsWith(join('.plex-space', 'worktrees', 'feat-a'))).toBe(true)
    expect(await exists(path)).toBe(true)
    expect(await branchExists('feat-a')).toBe(true)
    const { stdout } = await realGit(['status', '--porcelain'], repo)
    expect(stdout.trim()).toBe('') // .plex-space/ is excluded → not shown as untracked
    const exclude = await readFile(join(repo, '.git', 'info', 'exclude'), 'utf8')
    expect(exclude).toContain('.plex-space/')
  })

  it('rejects an invalid (injection-y) branch name before touching the repo', async () => {
    await expect(createWorktree(repo, 'bad; rm -rf x')).rejects.toThrow()
    expect(await exists(join(repo, '.plex-space', 'worktrees', 'bad; rm -rf x'))).toBe(false)
  })

  it('cleanup keeps a dirty worktree (branch + dir survive)', async () => {
    const path = join(repo, '.plex-space', 'worktrees', 'feat-a')
    await writeFile(join(path, 'scratch.txt'), 'wip\n') // untracked → dirty
    const kept = await cleanupWorktree(repo, { branch: 'feat-a', path })
    expect(kept).toEqual({ branch: 'feat-a', path, reason: 'dirty' })
    expect(await exists(path)).toBe(true)
    expect(await branchExists('feat-a')).toBe(true)
  })

  it('cleanup removes a clean worktree and force-deletes its branch', async () => {
    const path = join(repo, '.plex-space', 'worktrees', 'feat-a')
    await rm(join(path, 'scratch.txt')) // back to clean
    const kept = await cleanupWorktree(repo, { branch: 'feat-a', path })
    expect(kept).toBeNull()
    expect(await exists(path)).toBe(false)
    expect(await branchExists('feat-a')).toBe(false)
  })

  it('resumeWorktree reattaches an existing branch and is idempotent', async () => {
    await realGit(['branch', 'resume-me'], repo) // pre-existing branch, no worktree
    const first = await resumeWorktree(repo, 'resume-me')
    expect(await exists(first)).toBe(true)
    expect(await branchExists('resume-me')).toBe(true)
    const second = await resumeWorktree(repo, 'resume-me') // reuse, no error
    expect(second).toBe(first)
  })
})

// ── .worktreeinclude selection (fake clone, real fs) ──────────────

describe('populateWorktree selection', () => {
  it('clones existing entries, skipping comments, blanks, missing, and escaping paths', async () => {
    const root = await mkdtemp(join(tmpdir(), 'plex-inc-'))
    const dst = await mkdtemp(join(tmpdir(), 'plex-wtdst-'))
    await writeFile(join(root, '.env'), 'SECRET=1\n')
    await mkdir(join(root, 'node_modules'))
    await writeFile(
      join(root, '.worktreeinclude'),
      '# bring these over\n\n.env\nnode_modules\nmissing-thing\n../escape\n/abs\n'
    )
    const cloned: string[] = []
    const clone = async (src: string): Promise<void> => {
      cloned.push(src)
    }
    const result = await populateWorktree(root, dst, clone)
    expect(result.sort()).toEqual(['.env', 'node_modules'])
    expect(cloned.sort()).toEqual([join(root, '.env'), join(root, 'node_modules')].sort())
    await rm(root, { recursive: true, force: true })
    await rm(dst, { recursive: true, force: true })
  })

  it('returns nothing when there is no .worktreeinclude', async () => {
    const root = await mkdtemp(join(tmpdir(), 'plex-noinc-'))
    const dst = await mkdtemp(join(tmpdir(), 'plex-wtdst-'))
    const result = await populateWorktree(root, dst, async () => {})
    expect(result).toEqual([])
    await rm(root, { recursive: true, force: true })
    await rm(dst, { recursive: true, force: true })
  })
})

// ── .worktreeinclude end-to-end (real git + APFS clonefile) ──────────────

describe('worktree includes (real git + clonefile)', () => {
  let repo: string

  beforeAll(async () => {
    repo = await mkdtemp(join(tmpdir(), 'plex-inc-repo-'))
    await realGit(['init', '-b', 'main'], repo)
    await realGit(['config', 'user.email', 't@e.com'], repo)
    await realGit(['config', 'user.name', 'T'], repo)
    await writeFile(join(repo, 'README.md'), '# x\n')
    // .gitignore the essentials (as real projects do) so the clones read as IGNORED, not untracked.
    await writeFile(join(repo, '.gitignore'), 'node_modules\n.env\n')
    await realGit(['add', '.'], repo)
    await realGit(['commit', '-m', 'init'], repo)
    // gitignored essentials that exist only in the main worktree:
    await writeFile(join(repo, '.env'), 'SECRET=main\n')
    await mkdir(join(repo, 'node_modules'))
    await writeFile(join(repo, 'node_modules', 'dep.js'), 'module.exports = 1\n')
    await writeFile(join(repo, '.worktreeinclude'), '.env\nnode_modules\nmissing\n')
  })

  afterAll(async () => {
    await rm(repo, { recursive: true, force: true })
  })

  it('createWorktree clones .env + node_modules into the worktree, kept isolated (CoW)', async () => {
    const path = await createWorktree(repo, 'inc-1')
    expect(await readFile(join(path, '.env'), 'utf8')).toContain('SECRET=main')
    expect(await readFile(join(path, 'node_modules', 'dep.js'), 'utf8')).toContain('module.exports')
    // clonefile is copy-on-write: editing the worktree copy must not touch the main repo
    await writeFile(join(path, '.env'), 'SECRET=worktree\n')
    expect(await readFile(join(repo, '.env'), 'utf8')).toContain('SECRET=main')
  })

  // The includes×cleanup intersection: a worktree full of *ignored* clones still reads clean,
  // so close-cleanup must remove it (not falsely report it as dirty-kept).
  it('cleanup removes an unmodified worktree even though it is full of cloned ignored files', async () => {
    const path = await createWorktree(repo, 'inc-clean')
    expect(await readFile(join(path, 'node_modules', 'dep.js'), 'utf8')).toContain('module.exports')
    const { stdout } = await realGit(['status', '--porcelain'], path)
    expect(stdout.trim()).toBe('') // ignored clones don't make it look dirty
    const kept = await cleanupWorktree(repo, { branch: 'inc-clean', path })
    expect(kept).toBeNull() // removed, not falsely kept
    await expect(stat(path)).rejects.toThrow() // dir gone (with its cloned node_modules)
    await expect(
      realGit(['show-ref', '--verify', '--quiet', 'refs/heads/inc-clean'], repo)
    ).rejects.toThrow()
  })
})
