import { useState, useEffect } from 'react'
import type { Layout } from '../../shared/layout'

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
  { value: 4, label: '4 Panes' },
  { value: 6, label: '6 Panes' }
]

const AGENTS: { command: string; label: string }[] = [
  { command: 'claude', label: 'Claude Code' },
  { command: 'codex', label: 'Codex CLI' }
]

const styles = {
  overlay: {
    width: '100vw',
    height: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties,
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 9,
    padding: '32px 40px',
    width: 460,
    color: 'var(--text)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text)' } as React.CSSProperties,
  stepLabel: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 6
  } as React.CSSProperties,
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text)',
    padding: '7px 10px',
    fontSize: 13,
    marginBottom: 16
  } as React.CSSProperties,
  dirRow: { display: 'flex', gap: 8, marginBottom: 16 } as React.CSSProperties,
  dirInput: {
    flex: 1,
    minWidth: 0,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text)',
    padding: '7px 10px',
    fontSize: 13
  } as React.CSSProperties,
  browseBtn: {
    background: 'var(--elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-secondary)',
    padding: '7px 14px',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: '150ms ease-out'
  } as React.CSSProperties,
  browseBtnHov: { border: '1px solid var(--border-strong)', color: 'var(--text)' } as React.CSSProperties,
  optionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 16
  } as React.CSSProperties,
  optionBtn: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-secondary)',
    padding: '10px',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: '150ms ease-out'
  } as React.CSSProperties,
  optionBtnHov: {
    background: 'var(--elevated)',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)'
  } as React.CSSProperties,
  // delta: only the 3 properties that differ from optionBtn
  optionBtnSel: {
    background: 'var(--elevated)',
    border: '1px solid var(--accent)',
    color: 'var(--text)'
  } as React.CSSProperties,
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 24
  } as React.CSSProperties,
  backBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-secondary)',
    padding: '8px 20px',
    fontSize: 13,
    cursor: 'pointer',
    transition: '150ms ease-out'
  } as React.CSSProperties,
  backBtnHov: {
    background: 'var(--elevated)',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)'
  } as React.CSSProperties,
  nextBtn: {
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 6,
    color: 'var(--on-accent)',
    padding: '8px 24px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: '150ms ease-out'
  } as React.CSSProperties,
  nextBtnHov: { background: 'var(--accent-hover)' } as React.CSSProperties,
  // delta: only the 4 properties that differ from nextBtn
  nextBtnDis: {
    background: 'var(--elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    cursor: 'not-allowed'
  } as React.CSSProperties,
  notInstalledBadge: {
    display: 'inline-block',
    marginTop: 4,
    fontSize: 11,
    color: 'var(--warning)',
    border: '1px solid var(--warning)',
    borderRadius: 3,
    padding: '1px 6px'
  } as React.CSSProperties
}

// Pre-computed merged style objects — stable references so React avoids
// redundant DOM style patches on every re-render while a button is hovered.
const merged = {
  browseHov: { ...styles.browseBtn, ...styles.browseBtnHov },
  backHov:   { ...styles.backBtn,   ...styles.backBtnHov   },
  nextHov:   { ...styles.nextBtn,   ...styles.nextBtnHov   },
  nextDis:   { ...styles.nextBtn,   ...styles.nextBtnDis   },
  optHov:    { ...styles.optionBtn, ...styles.optionBtnHov },
  optSel:    { ...styles.optionBtn, ...styles.optionBtnSel },
} as Record<string, React.CSSProperties>

function optionStyle(selected: boolean, key: string, hovered: string | null): React.CSSProperties {
  if (selected) return merged.optSel
  if (hovered === key) return merged.optHov
  return styles.optionBtn
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

  const [step, setStep] = useState(firstStep)
  const [cwd, setCwd] = useState(spaceCwd ?? '')
  const [name, setName] = useState(spaceName ?? '')
  const [layout, setLayout] = useState<Layout>(initialLayout)
  const [agentCommand, setAgentCommand] = useState(initialAgent)
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    Promise.all(
      AGENTS.map(({ command }) =>
        window.spaceAPI.isInstalled(command).then((installed) => [command, installed] as const)
      )
    ).then((entries) => setAvailability(Object.fromEntries(entries)))
  }, [])

  async function handleBrowse(): Promise<void> {
    const result = await window.spaceAPI.selectDirectory()
    if (!result) return
    setCwd(result.path)
    if (!name) setName(result.name)
  }

  function handleLaunch(): void {
    onLaunch({ name, cwd, layout, agentCommand })
  }

  const displayStep = mode === 'open' ? step - 1 : step
  const title = mode === 'open' ? `Open "${spaceName}"` : 'New Space'
  const isFirstStep = step === firstStep
  const isLastStep = step === 3
  const nextDisabled = isFirstStep && !cwd

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.title}>{title}</div>
        <div style={styles.stepLabel}>
          Step {displayStep} of {totalSteps}
        </div>

        {step === 1 && (
          <>
            <label style={styles.label}>Directory</label>
            <div style={styles.dirRow}>
              <input
                style={styles.dirInput}
                value={cwd}
                onChange={(e) => {
                  setCwd(e.target.value)
                  if (!name) setName(e.target.value.split('/').pop() ?? '')
                }}
                placeholder="Choose a folder..."
              />
              <button
                style={hovered === 'browse' ? merged.browseHov : styles.browseBtn}
                onClick={handleBrowse}
                onMouseEnter={() => setHovered('browse')}
                onMouseLeave={() => setHovered(null)}
              >
                Browse
              </button>
            </div>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Space name"
            />
          </>
        )}

        {step === 2 && (
          <>
            <label style={styles.label}>Layout</label>
            <div style={styles.optionGrid}>
              {LAYOUTS.map(({ value, label }) => {
                const key = String(value)
                return (
                  <button
                    key={value}
                    style={optionStyle(layout === value, key, hovered)}
                    onClick={() => setLayout(value)}
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <label style={styles.label}>Agent</label>
            <div style={styles.optionGrid}>
              {AGENTS.map(({ command, label }) => (
                <button
                  key={command}
                  style={optionStyle(agentCommand === command, command, hovered)}
                  onClick={() => setAgentCommand(command)}
                  onMouseEnter={() => setHovered(command)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div>{label}</div>
                  {availability[command] === false && (
                    <div style={styles.notInstalledBadge}>not installed</div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        <div style={styles.footer}>
          <button
            style={hovered === 'back' ? merged.backHov : styles.backBtn}
            onClick={() => (isFirstStep ? onCancel?.() : setStep((s) => s - 1))}
            onMouseEnter={() => setHovered('back')}
            onMouseLeave={() => setHovered(null)}
          >
            {isFirstStep ? 'Cancel' : 'Back'}
          </button>
          <button
            style={nextDisabled ? merged.nextDis : hovered === 'next' ? merged.nextHov : styles.nextBtn}
            disabled={nextDisabled}
            onClick={isLastStep ? handleLaunch : () => setStep((s) => s + 1)}
            onMouseEnter={() => setHovered('next')}
            onMouseLeave={() => setHovered(null)}
          >
            {isLastStep ? 'Launch' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
