import { useState } from 'react'
import type { Layout } from './layoutGeometry'

export interface SpaceConfig {
  name: string
  cwd: string
  layout: Layout
  agentCommand: string
}

interface Props {
  onLaunch: (config: SpaceConfig) => void
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
    color: '#e0e0e0',
    fontFamily: 'system-ui, sans-serif'
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
  optionBtn: (selected: boolean): React.CSSProperties => ({
    background: selected ? '#0066cc' : '#1e1e1e',
    border: `1px solid ${selected ? '#0066cc' : '#444'}`,
    borderRadius: 4,
    color: selected ? '#fff' : '#ccc',
    padding: '10px',
    fontSize: 14,
    cursor: 'pointer',
    textAlign: 'center'
  }),
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
  nextBtn: (disabled: boolean): React.CSSProperties => ({
    background: disabled ? '#333' : '#0066cc',
    border: 'none',
    borderRadius: 4,
    color: disabled ? '#666' : '#fff',
    padding: '8px 24px',
    fontSize: 14,
    cursor: disabled ? 'not-allowed' : 'pointer'
  })
}

export default function NewSpaceWizard({ onLaunch }: Props): React.JSX.Element {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [cwd, setCwd] = useState('')
  const [name, setName] = useState('')
  const [layout, setLayout] = useState<Layout>(4)
  const [agentCommand, setAgentCommand] = useState('claude')

  async function handleBrowse(): Promise<void> {
    const result = await window.spaceAPI.selectDirectory()
    if (!result) return
    setCwd(result.path)
    if (!name) setName(result.name)
  }

  function handleLaunch(): void {
    onLaunch({ name, cwd, layout, agentCommand })
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.title}>New Space</div>
        <div style={styles.stepLabel}>Step {step} of 3</div>

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
                  style={styles.optionBtn(layout === value)}
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
                  style={styles.optionBtn(agentCommand === command)}
                  onClick={() => setAgentCommand(command)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        <div style={styles.footer}>
          <button
            style={{ ...styles.backBtn, visibility: step === 1 ? 'hidden' : 'visible' }}
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
          >
            Back
          </button>
          {step < 3 ? (
            <button
              style={styles.nextBtn(step === 1 && !cwd)}
              disabled={step === 1 && !cwd}
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
            >
              Next
            </button>
          ) : (
            <button style={styles.nextBtn(false)} onClick={handleLaunch}>
              Launch
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
