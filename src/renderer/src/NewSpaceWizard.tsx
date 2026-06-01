import { useEffect, useRef, useState } from 'react'
import type { Layout } from '../../shared/layout'
import claudeIcon from './assets/agents/claude.svg'
import openAiIcon from './assets/agents/openai.svg'

export interface SpaceConfig {
  name: string
  cwd: string
  layout: Layout
  agentCommand: string
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
  const totalSteps = mode === 'open' ? 2 : 3
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const selectedOptionRef = useRef<HTMLButtonElement>(null)

  const [step, setStep] = useState(firstStep)
  const [cwd, setCwd] = useState(spaceCwd ?? '')
  const [name, setName] = useState(spaceName ?? '')
  const [layout, setLayout] = useState<Layout>(initialLayout)
  const [agentCommand, setAgentCommand] = useState(initialAgent)
  const [availability, setAvailability] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all(
      AGENTS.map(({ command }) =>
        window.spaceAPI.isInstalled(command).then((installed) => [command, installed] as const)
      )
    ).then((entries) => setAvailability(Object.fromEntries(entries)))
  }, [])

  useEffect(() => {
    if (step === 1) directoryInputRef.current?.focus()
    else selectedOptionRef.current?.focus()
  }, [step])

  async function handleBrowse(): Promise<void> {
    const result = await window.spaceAPI.selectDirectory()
    if (!result) return
    setCwd(result.path)
    if (!name.trim()) setName(result.name)
  }

  function handleLaunch(): void {
    onLaunch({ name: name.trim(), cwd: cwd.trim(), layout, agentCommand })
  }

  function handleBack(): void {
    if (step === firstStep) onCancel?.()
    else setStep((current) => current - 1)
  }

  function handlePrimaryAction(): void {
    if (step === 3) handleLaunch()
    else setStep((current) => current + 1)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel?.()
      return
    }

    const isButton = event.target instanceof HTMLButtonElement
    if (event.key === 'Enter' && !isButton && !nextDisabled) {
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
  const isLastStep = step === 3
  const nextDisabled = step === 1 && (!cwd.trim() || !name.trim())
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
}
