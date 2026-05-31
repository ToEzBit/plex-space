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
    background: '#1e1e1e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties,
  card: {
    background: '#2d2d2d',
    borderRadius: 8,
    padding: '32px 40px',
    width: 460,
    color: '#e0e0e0'
  } as React.CSSProperties,
  title: { fontSize: 18, fontWeight: 600, marginBottom: 4 } as React.CSSProperties,
  stepLabel: { fontSize: 13, color: '#888', marginBottom: 24 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6 } as React.CSSProperties,
  input: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#1e1e1e',
    border: '1px solid #444',
    borderRadius: 4,
    color: '#e0e0e0',
    padding: '7px 10px',
    fontSize: 14,
    marginBottom: 16
  } as React.CSSProperties,
  dirRow: { display: 'flex', gap: 8, marginBottom: 16 } as React.CSSProperties,
  dirInput: {
    flex: 1,
    background: '#1e1e1e',
    border: '1px solid #444',
    borderRadius: 4,
    color: '#e0e0e0',
    padding: '7px 10px',
    fontSize: 14
  } as React.CSSProperties,
  browseBtn: {
    background: '#3a3a3a',
    border: '1px solid #555',
    borderRadius: 4,
    color: '#ccc',
    padding: '7px 14px',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  } as React.CSSProperties,
  optionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 16
  } as React.CSSProperties,
  optionBtn: {
    background: '#1e1e1e',
    border: '1px solid #444',
    borderRadius: 4,
    color: '#ccc',
    padding: '10px',
    fontSize: 14,
    cursor: 'pointer',
    textAlign: 'center'
  } as React.CSSProperties,
  get optionBtnSelected(): React.CSSProperties {
    return { ...this.optionBtn, background: '#0066cc', border: '1px solid #0066cc', color: '#fff' }
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 8
  } as React.CSSProperties,
  backBtn: {
    background: 'transparent',
    border: '1px solid #555',
    borderRadius: 4,
    color: '#aaa',
    padding: '8px 20px',
    fontSize: 14,
    cursor: 'pointer'
  } as React.CSSProperties,
  nextBtn: {
    background: '#0066cc',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    padding: '8px 24px',
    fontSize: 14,
    cursor: 'pointer'
  } as React.CSSProperties,
  nextBtnDisabled: {
    background: '#333',
    border: 'none',
    borderRadius: 4,
    color: '#666',
    padding: '8px 24px',
    fontSize: 14,
    cursor: 'not-allowed'
  } as React.CSSProperties,
  notInstalledBadge: {
    display: 'inline-block',
    marginTop: 4,
    fontSize: 11,
    color: '#f0a000',
    background: '#3a2e00',
    borderRadius: 3,
    padding: '1px 6px'
  } as React.CSSProperties
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
              <button style={styles.browseBtn} onClick={handleBrowse}>
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
              {LAYOUTS.map(({ value, label }) => (
                <button
                  key={value}
                  style={layout === value ? styles.optionBtnSelected : styles.optionBtn}
                  onClick={() => setLayout(value)}
                >
                  {label}
                </button>
              ))}
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
                  style={agentCommand === command ? styles.optionBtnSelected : styles.optionBtn}
                  onClick={() => setAgentCommand(command)}
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
            style={styles.backBtn}
            onClick={() => (isFirstStep ? onCancel?.() : setStep((s) => s - 1))}
          >
            {isFirstStep ? 'Cancel' : 'Back'}
          </button>
          {!isLastStep ? (
            <button
              style={isFirstStep && !cwd ? styles.nextBtnDisabled : styles.nextBtn}
              disabled={isFirstStep && !cwd}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </button>
          ) : (
            <button style={styles.nextBtn} onClick={handleLaunch}>
              Launch
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
