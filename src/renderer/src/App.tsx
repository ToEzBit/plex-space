import { useState } from 'react'
import PaneTerminal from './PaneTerminal'
import { layoutGeometry } from './layoutGeometry'
import NewSpaceWizard, { type SpaceConfig } from './NewSpaceWizard'

function App(): React.JSX.Element {
  const [config, setConfig] = useState<SpaceConfig | null>(null)

  if (!config) {
    return <NewSpaceWizard onLaunch={setConfig} />
  }

  const { cols, rows } = layoutGeometry(config.layout)

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#1e1e1e',
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: '2px',
        padding: '4px',
        boxSizing: 'border-box'
      }}
    >
      {Array.from({ length: config.layout }, (_, i) => (
        <PaneTerminal
          key={`terminal-${i}`}
          terminalId={`terminal-${i}`}
          cwd={config.cwd}
          agentCommand={config.agentCommand}
        />
      ))}
    </div>
  )
}

export default App
