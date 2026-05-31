import { useState, useEffect } from 'react'
import PaneTerminal from './PaneTerminal'
import { layoutGeometry } from './layoutGeometry'
import NewSpaceWizard, { type SpaceConfig } from './NewSpaceWizard'
import SpaceList from './SpaceList'

type View = 'list' | 'new-wizard' | 'open-wizard' | 'grid'

function App(): React.JSX.Element {
  const [view, setView] = useState<View>('list')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [lastUsed, setLastUsedState] = useState<LastUsed | null>(null)
  const [pendingSpace, setPendingSpace] = useState<Space | null>(null)
  const [activeConfig, setActiveConfig] = useState<SpaceConfig | null>(null)

  useEffect(() => {
    Promise.all([window.spaceAPI.listSpaces(), window.spaceAPI.getLastUsed()]).then(([s, lu]) => {
      setSpaces(s)
      setLastUsedState(lu)
    })
  }, [])

  async function launch(config: SpaceConfig): Promise<void> {
    const lu: LastUsed = { layout: config.layout, agent: config.agentCommand }
    await window.spaceAPI.setLastUsed(lu)
    setLastUsedState(lu)
    setActiveConfig(config)
    setView('grid')
  }

  async function handleNewSpaceLaunch(config: SpaceConfig): Promise<void> {
    const space = await window.spaceAPI.createSpace({ name: config.name, directory: config.cwd })
    setSpaces((prev) => [...prev, space])
    await launch(config)
  }

  async function handleRemoveSpace(id: string): Promise<void> {
    await window.spaceAPI.removeSpace(id)
    setSpaces((prev) => prev.filter((s) => s.id !== id))
  }

  if (view === 'list') {
    return (
      <SpaceList
        spaces={spaces}
        onNewSpace={() => setView('new-wizard')}
        onOpenSpace={(space) => {
          setPendingSpace(space)
          setView('open-wizard')
        }}
        onRemoveSpace={handleRemoveSpace}
      />
    )
  }

  if (view === 'new-wizard') {
    return (
      <NewSpaceWizard
        mode="new"
        initialLayout={lastUsed?.layout ?? 4}
        initialAgent={lastUsed?.agent ?? 'claude'}
        onLaunch={handleNewSpaceLaunch}
        onCancel={() => setView('list')}
      />
    )
  }

  if (view === 'open-wizard' && pendingSpace) {
    return (
      <NewSpaceWizard
        mode="open"
        spaceName={pendingSpace.name}
        spaceCwd={pendingSpace.directory}
        initialLayout={lastUsed?.layout ?? 4}
        initialAgent={lastUsed?.agent ?? 'claude'}
        onLaunch={launch}
        onCancel={() => setView('list')}
      />
    )
  }

  if (view === 'grid' && activeConfig) {
    const { cols, rows } = layoutGeometry(activeConfig.layout)
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            background: '#181818',
            borderBottom: '1px solid #333',
            fontFamily: 'system-ui, sans-serif',
            color: '#aaa',
            fontSize: 13,
            flexShrink: 0
          }}
        >
          <span>{activeConfig.name}</span>
          <button
            onClick={() => setView('list')}
            style={{
              background: 'transparent',
              border: '1px solid #444',
              borderRadius: 4,
              color: '#aaa',
              padding: '3px 10px',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Space List
          </button>
        </div>
        <div
          style={{
            flex: 1,
            background: '#1e1e1e',
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gap: '2px',
            padding: '4px',
            boxSizing: 'border-box'
          }}
        >
          {Array.from({ length: activeConfig.layout }, (_, i) => (
            <PaneTerminal
              key={`terminal-${i}`}
              terminalId={`terminal-${i}`}
              cwd={activeConfig.cwd}
              agentCommand={activeConfig.agentCommand}
            />
          ))}
        </div>
      </div>
    )
  }

  return <></>
}

export default App
