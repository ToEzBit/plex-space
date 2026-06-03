import { useEffect, useRef, useState } from 'react'
import type { Layout } from '../../shared/layout'
import type { PaneWorktree, ManagedWorktree } from '../../shared/worktree'
import claudeIcon from './assets/agents/claude.svg'
import openAiIcon from './assets/agents/openai.svg'

export interface SpaceConfig {
  name: string
  cwd: string
  layout: Layout
  agentCommand: string
  /** Per-Pane worktree choice (length === layout). All 'none' for non-git directories. */
  paneChoices: PaneWorktree[]
}

interface Props {
  mode?: 'new' | 'open'
  spaceName?: string
  spaceCwd?: string
  initialLayout?: Layout
  initialAgent?: string
  onLaunch: (config: SpaceConfig) => void
  onCancel?: () => void
}

const LAYOUTS: { value: Layout; label: string }[] = [
  { value: 1, label: '1 Pane' },
  { value: 2, label: '2 Panes' },
  { value: 3, label: '3 Panes' },
  { value: 4, label: '4 Panes' },
  { value: 6, label: '6 Panes' }
]

const AGENTS: { command: string; label: string; icon: string }[] = [
  { command: 'claude', label: 'Claude Code', icon: claudeIcon },
  { command: 'codex', label: 'Codex CLI', icon: openAiIcon }
]

interface WorktreeCtx {
  isRepo: boolean
  managed: ManagedWorktree[]
  branches: string[]
}

function LayoutPreview({ panes }: { panes: Layout }): React.JSX.Element {
  return (
    <span className={`layout-preview layout-preview-${panes}`} aria-hidden="true">
      {Array.from({ length: panes }, (_, index) => (
        <i key={index} />
      ))}
    </span>
  )
}

function cycleValue<T>(values: T[], current: T, direction: number): T {
  const currentIndex = values.indexOf(current)
  return values[(currentIndex + direction + values.length) % values.length]
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'work'
  )
}

/** A default branch name for a Pane that avoids existing refs and names already taken by other Panes. */
function defaultBranch(slug: string, paneIndex: number, taken: Set<string>): string {
  const base = `${slug}-${paneIndex}`
  let name = base
  let n = 2
  while (taken.has(name)) name = `${base}-${n++}`
  return name
}

export default function NewSpaceWizard({
  mode = 'new',
  spaceName,
  spaceCwd,
  initialLayout = 4,
  initialAgent = 'claude',
  onLaunch,
  onCancel
}: Props): React.JSX.Element {
  const firstStep = mode === 'open' ? 2 : 1
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const selectedOptionRef = useRef<HTMLButtonElement>(null)

  const [step, setStep] = useState(firstStep)
  const [cwd, setCwd] = useState(spaceCwd ?? '')
  const [name, setName] = useState(spaceName ?? '')
  const [layout, setLayout] = useState<Layout>(initialLayout)
  const [agentCommand, setAgentCommand] = useState(initialAgent)
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [wt, setWt] = useState<WorktreeCtx>({
    isRepo: false,
    managed: [],
    branches: []
  })
  const [worktrees, setWorktrees] = useState<PaneWorktree[]>(
    Array.from({ length: initialLayout }, () => ({ kind: 'none' }))
  )
  // Which directory's worktree context we've actually loaded — guards the step-3→4 race.
  const [wtLoadedDir, setWtLoadedDir] = useState<string | null>(null)

  useEffect(() => {
    Promise.all(
      AGENTS.map(({ command }) =>
        window.spaceAPI.isInstalled(command).then((installed) => [command, installed] as const)
      )
    ).then((entries) => setAvailability(Object.fromEntries(entries)))
  }, [])

  // Load worktree context once a directory is committed (open mode starts past step 1).
  useEffect(() => {
    const dir = cwd.trim()
    if (!dir || step === 1 || dir === wtLoadedDir) return // already loaded for this dir
    let cancelled = false
    const loadContext = window.spaceAPI.worktreeContext
    if (typeof loadContext !== 'function') {
      // Preload is stale (new IPC not loaded) — restart `npm run dev` to rebuild main + preload.
      console.error('[plex] worktreeContext IPC unavailable — fully restart `npm run dev`')
      setWtLoadedDir(dir)
      return
    }
    loadContext(dir)
      .then((ctx) => {
        if (cancelled) return
        setWt(ctx)
        setWtLoadedDir(dir)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('[plex] worktreeContext failed for', dir, err)
        setWtLoadedDir(dir) // unblock the wizard rather than disabling Continue forever
      })
    return () => {
      cancelled = true
    }
  }, [cwd, step])

  // Keep the per-Pane worktree array the same length as the chosen Layout.
  useEffect(() => {
    setWorktrees((prev) => {
      const next = prev.slice(0, layout)
      while (next.length < layout) next.push({ kind: 'none' })
      return next
    })
  }, [layout])

  useEffect(() => {
    if (step === 1) directoryInputRef.current?.focus()
    else selectedOptionRef.current?.focus()
  }, [step])

  const lastStep = wt.isRepo ? 4 : 3
  const totalSteps = lastStep - firstStep + 1

  function takenBranches(exceptPane: number): Set<string> {
    const taken = new Set(wt.branches)
    worktrees.forEach((w, idx) => {
      if (idx !== exceptPane && w.kind !== 'none') taken.add(w.branch)
    })
    return taken
  }

  function setPaneEnabled(i: number, enabled: boolean): void {
    setWorktrees((prev) =>
      prev.map((w, idx) => {
        if (idx !== i) return w
        if (!enabled) return { kind: 'none' }
        return {
          kind: 'new',
          branch: defaultBranch(slugify(name), i + 1, takenBranches(i))
        }
      })
    )
  }

  function setPaneBranch(i: number, branch: string): void {
    setWorktrees((prev) => prev.map((w, idx) => (idx === i ? { kind: 'new', branch } : w)))
  }

  function pickResume(i: number, branch: string): void {
    setWorktrees((prev) => prev.map((w, idx) => (idx === i ? { kind: 'resume', branch } : w)))
  }

  function handleLaunch(): void {
    const paneChoices = wt.isRepo ? worktrees : worktrees.map(() => ({ kind: 'none' as const }))
    onLaunch({
      name: name.trim(),
      cwd: cwd.trim(),
      layout,
      agentCommand,
      paneChoices
    })
  }

  function handleBack(): void {
    if (step === firstStep) onCancel?.()
    else setStep((current) => current - 1)
  }

  function handlePrimaryAction(): void {
    if (step === lastStep) handleLaunch()
    else setStep((current) => current + 1)
  }

  // A worktree Pane needs a non-empty branch; two Panes can't claim the same new branch.
  const worktreeInvalid = (() => {
    const active = worktrees.filter((w) => w.kind !== 'none')
    if (active.some((w) => w.branch.trim() === '')) return true
    const names = active.map((w) => w.branch.trim())
    return new Set(names).size !== names.length
  })()

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel?.()
      return
    }

    // Enter advances through steps, but never launches — launching the Space is an explicit
    // click, so a stray Enter while typing a branch name can't fire off the whole grid.
    const isButton = event.target instanceof HTMLButtonElement
    if (event.key === 'Enter' && !isButton && !nextDisabled && step !== lastStep) {
      event.preventDefault()
      handlePrimaryAction()
      return
    }

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const direction = event.key === 'ArrowLeft' ? -1 : 1
    if (step === 2) {
      event.preventDefault()
      setLayout(
        cycleValue(
          LAYOUTS.map(({ value }) => value),
          layout,
          direction
        )
      )
    }
    if (step === 3) {
      event.preventDefault()
      setAgentCommand(
        cycleValue(
          AGENTS.map(({ command }) => command),
          agentCommand,
          direction
        )
      )
    }
  }

  const displayStep = mode === 'open' ? step - 1 : step
  const isFirstStep = step === firstStep
  const isLastStep = step === lastStep
  // Until we've loaded the entered dir's git context, we don't yet know whether a worktree step
  // exists — so don't let the user blow past step 3 (and skip worktrees) on a slow filesystem.
  const wtLoaded = wtLoadedDir === cwd.trim()
  const nextDisabled =
    (step === 1 && (!cwd.trim() || !name.trim())) ||
    (step === 3 && cwd.trim() !== '' && !wtLoaded) ||
    (step === 4 && worktreeInvalid)
  const openPath = mode === 'open' ? spaceCwd : undefined

  return (
    <div className="wizard-overlay" onKeyDown={handleKeyDown}>
      <section
        className="wizard-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
      >
        <header className="wizard-header">
          <div>
            <div id="wizard-title" className="wizard-title">
              {mode === 'open' ? `Open "${spaceName}"` : 'New Space'}
            </div>
            {openPath && <div className="wizard-context-path">{openPath}</div>}
          </div>
          <div className="wizard-progress" aria-label={`Step ${displayStep} of ${totalSteps}`}>
            {Array.from({ length: totalSteps }, (_, index) => (
              <span key={index} className={index < displayStep ? 'active' : ''} />
            ))}
          </div>
          <button className="wizard-close" onClick={onCancel} aria-label="Cancel">
            ×
          </button>
        </header>

        <div className="wizard-body">
          {step === 1 && (
            <>
              <div className="wizard-kicker">New Space</div>
              <h2>Choose a working directory</h2>
              <p>
                Your Space stays bound to this directory. You can choose the Layout and Agent each
                time you open it.
              </p>
              <label htmlFor="space-directory">Directory</label>
              <div className="wizard-directory-row">
                <input
                  id="space-directory"
                  ref={directoryInputRef}
                  value={cwd}
                  onChange={(event) => {
                    setCwd(event.target.value)
                    if (!name.trim()) setName(event.target.value.split('/').pop() ?? '')
                  }}
                  placeholder="Choose or paste a directory..."
                />
                <button className="btn-secondary" onClick={handleBrowse}>
                  Browse...
                </button>
              </div>
              <label htmlFor="space-name">Space name</label>
              <input
                id="space-name"
                className="wizard-text-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Space name"
              />
            </>
          )}

          {step === 2 && (
            <>
              <div className="wizard-kicker">Layout</div>
              <h2>How many Panes do you need?</h2>
              <p>Every Pane opens a Terminal in the same Space directory.</p>
              <div className="wizard-layout-options">
                {LAYOUTS.map(({ value, label }) => (
                  <button
                    key={value}
                    ref={layout === value ? selectedOptionRef : undefined}
                    className="wizard-layout-option"
                    data-selected={layout === value}
                    onClick={() => setLayout(value)}
                  >
                    <LayoutPreview panes={value} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="wizard-kicker">Agent</div>
              <h2>Choose an Agent</h2>
              <p>The same Agent launches in every Pane. You can choose differently next time.</p>
              <div className="wizard-agent-options">
                {AGENTS.map(({ command, label, icon }) => (
                  <button
                    key={command}
                    ref={agentCommand === command ? selectedOptionRef : undefined}
                    className="wizard-agent-option"
                    data-selected={agentCommand === command}
                    onClick={() => setAgentCommand(command)}
                  >
                    <i>
                      <img src={icon} alt="" />
                    </i>
                    <span>
                      <strong>{label}</strong>
                      <small>{command}</small>
                    </span>
                    {availability[command] === false && <em>Not installed</em>}
                    {availability[command] !== false && agentCommand === command && <b>✓</b>}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="wizard-kicker">Worktrees</div>
              <h2>Isolate any Pane in its own git worktree?</h2>
              <p>
                A worktree Pane runs the Agent on its own branch, forked from your current HEAD.
                Other Panes run in the Space directory.
              </p>
              <div className="wizard-worktree-list">
                {worktrees.map((w, i) => {
                  const enabled = w.kind !== 'none'
                  return (
                    <div className="wizard-worktree-pane" key={i} data-on={enabled}>
                      <div className="wizard-worktree-row">
                        <span className="wizard-worktree-label">Pane {i + 1}</span>
                        <div className="wizard-worktree-toggle">
                          <button data-selected={!enabled} onClick={() => setPaneEnabled(i, false)}>
                            Space dir
                          </button>
                          <button data-selected={enabled} onClick={() => setPaneEnabled(i, true)}>
                            Worktree
                          </button>
                        </div>
                      </div>
                      {enabled && (
                        <div className="wizard-worktree-config">
                          <input
                            className="wizard-worktree-branch"
                            value={w.branch}
                            onChange={(e) => setPaneBranch(i, e.target.value)}
                            placeholder="branch name"
                            spellCheck={false}
                          />
                          {w.kind === 'resume' && (
                            <span className="wizard-worktree-tag">↻ resume</span>
                          )}
                          {wt.managed.length > 0 && (
                            <div className="wizard-worktree-resume">
                              <small>Resume:</small>
                              {wt.managed.map((m) => {
                                const claimedByOther = worktrees.some(
                                  (o, idx) =>
                                    idx !== i && o.kind !== 'none' && o.branch === m.branch
                                )
                                const disabled = m.inUse || claimedByOther
                                return (
                                  <button
                                    key={m.branch}
                                    type="button"
                                    disabled={disabled}
                                    data-selected={w.kind === 'resume' && w.branch === m.branch}
                                    onClick={() => pickResume(i, m.branch)}
                                  >
                                    {m.branch}
                                    <em>{m.inUse ? 'in use' : m.state}</em>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <footer className="wizard-footer">
          <button className="btn-secondary" onClick={handleBack}>
            {isFirstStep ? 'Cancel' : 'Back'}
          </button>
          <button className="btn-primary" disabled={nextDisabled} onClick={handlePrimaryAction}>
            {isLastStep ? 'Launch Space' : 'Continue'} <b>→</b>
          </button>
        </footer>
      </section>
    </div>
  )

  async function handleBrowse(): Promise<void> {
    const result = await window.spaceAPI.selectDirectory()
    if (!result) return
    setCwd(result.path)
    if (!name.trim()) setName(result.name)
  }
}
