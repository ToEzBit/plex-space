import PaneTerminal from './PaneTerminal'
import { layoutGeometry, type Layout } from './layoutGeometry'

const LAYOUT: Layout = 4

function App(): React.JSX.Element {
  const { cols, rows } = layoutGeometry(LAYOUT)

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
      {Array.from({ length: LAYOUT }, (_, i) => (
        <PaneTerminal key={`terminal-${i}`} terminalId={`terminal-${i}`} />
      ))}
    </div>
  )
}

export default App
