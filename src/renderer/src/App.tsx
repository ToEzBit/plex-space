import { useState, useEffect, useMemo } from 'react'
import PaneTerminal from './PaneTerminal'
import { layoutGeometry } from './layoutGeometry'
import NewSpaceWizard, { type SpaceConfig } from './NewSpaceWizard'
import Sidebar from './Sidebar'

type View = 'idle' | 'new-wizard' | 'open-wizard'

interface OpenSpaceEntry {
  config: SpaceConfig
  terminalIds: string[]
}

const paneAreaStyle = {
  flex: 1,
  background: 'var(--bg)',
  display: 'grid',
  gap: 0,
  padding: '4px'
}

const wizardOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 100 }

function App(): React.JSX.Element {
  const [view, setView] = useState<View>('idle')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [lastUsed, setLastUsedState] = useState<LastUsed | null>(null)
  const [pendingSpace, setPendingSpace] = useState<Space | null>(null)
  const [openSpaces, setOpenSpaces] = useState<Record<string, OpenSpaceEntry>>({})
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    Promise.all([window.spaceAPI.listSpaces(), window.spaceAPI.getLastUsed()]).then(([s, lu]) => {
      setSpaces(s)
      setLastUsedState(lu)
    })
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.metaKey && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function launchSpace(spaceId: string, config: SpaceConfig): Promise<void> {
    const lu: LastUsed = { layout: config.layout, agent: config.agentCommand }
    await window.spaceAPI.setLastUsed(lu)
    setLastUsedState(lu)
    const { terminalIds } = await window.spaceAPI.openGrid(
      spaceId,
      config.cwd,
      config.layout,
      config.agentCommand
    )
    setOpenSpaces((prev) => ({ ...prev, [spaceId]: { config, terminalIds } }))
    setActiveSpaceId(spaceId)
    setView('idle')
  }

  async function handleNewSpaceLaunch(config: SpaceConfig): Promise<void> {
    const space = await window.spaceAPI.createSpace({ name: config.name, directory: config.cwd })
    setSpaces((prev) => [...prev, space])
    await launchSpace(space.id, config)
  }

  async function handleOpenSpaceLaunch(config: SpaceConfig): Promise<void> {
    if (!pendingSpace) return
    await launchSpace(pendingSpace.id, config)
  }

  async function handleSelectSpace(space: Space): Promise<void> {
    if (openSpaces[space.id]) {
      setActiveSpaceId(space.id)
    } else {
      setPendingSpace(space)
      setView('open-wizard')
    }
  }

  async function handleCloseSpace(spaceId: string): Promise<void> {
    await window.spaceAPI.closeGrid(spaceId)
    setOpenSpaces((prev) => {
      const next = { ...prev }
      delete next[spaceId]
      return next
    })
    setActiveSpaceId((prev) => (prev === spaceId ? null : prev))
  }

  async function handleRemoveSpace(id: string): Promise<void> {
    if (openSpaces[id]) {
      await handleCloseSpace(id)
    }
    await window.spaceAPI.removeSpace(id)
    setSpaces((prev) => prev.filter((s) => s.id !== id))
  }

  const openSpaceIds = useMemo(() => new Set(Object.keys(openSpaces)), [openSpaces])
  const activeEntry = activeSpaceId ? openSpaces[activeSpaceId] : null

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', position: 'relative' }}>
      <Sidebar
        spaces={spaces}
        openSpaceIds={openSpaceIds}
        activeSpaceId={activeSpaceId}
        open={sidebarOpen}
        onSelectSpace={handleSelectSpace}
        onNewSpace={() => setView('new-wizard')}
        onRemoveSpace={handleRemoveSpace}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Terminal grids — all kept in DOM, show/hide via display */}
        {Object.entries(openSpaces).map(([spaceId, { config, terminalIds }]) => {
          const isActive = spaceId === activeSpaceId
          const { cols, rows, paneSpans } = layoutGeometry(config.layout)
          return (
            <div
              key={spaceId}
              style={{
                display: isActive ? 'flex' : 'none',
                flex: 1,
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  ...paneAreaStyle,
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`
                }}
              >
                {terminalIds.map((terminalId, i) => {
                  const span = paneSpans?.[i]
                  if (span && span > 1) {
                    return (
                      <div key={terminalId} style={{ gridColumn: `span ${span}` }}>
                        <PaneTerminal terminalId={terminalId} visible={isActive} />
                      </div>
                    )
                  }
                  return <PaneTerminal key={terminalId} terminalId={terminalId} visible={isActive} />
                })}
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {!activeSpaceId && (
          <div className="main-empty-state">
            <div className="empty-state-glyph">◻</div>
            <div className="empty-state-title">No space selected</div>
            <div className="empty-state-sub">Select a Space from the sidebar, or create a new one</div>
          </div>
        )}

        {/* Close Space status bar */}
        {activeEntry && view === 'idle' && (
          <div className="close-space-bar">
            <span>
              {activeEntry.config.name}&nbsp;&nbsp;{activeEntry.config.cwd}
            </span>
            <button
              className="btn-close-space"
              onClick={() => {
                if (activeSpaceId && window.confirm('Close Space? This will stop all terminals.')) {
                  handleCloseSpace(activeSpaceId)
                }
              }}
            >
              Close Space
            </button>
          </div>
        )}
      </div>

      {/* Toggle pill — rendered after main area so it paints on top */}
      <button
        className={`sidebar-toggle${sidebarOpen ? '' : ' at-edge'}`}
        onClick={() => setSidebarOpen((prev) => !prev)}
        title="Toggle sidebar (⌘B)"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '‹' : '›'}
      </button>

      {/* Wizard overlays — fixed so they cover sidebar too */}
      {view === 'new-wizard' && (
        <div style={wizardOverlayStyle}>
          <NewSpaceWizard
            mode="new"
            initialLayout={lastUsed?.layout ?? 4}
            initialAgent={lastUsed?.agent ?? 'claude'}
            onLaunch={handleNewSpaceLaunch}
            onCancel={() => setView('idle')}
          />
        </div>
      )}

      {view === 'open-wizard' && pendingSpace && (
        <div style={wizardOverlayStyle}>
          <NewSpaceWizard
            mode="open"
            spaceName={pendingSpace.name}
            spaceCwd={pendingSpace.directory}
            initialLayout={lastUsed?.layout ?? 4}
            initialAgent={lastUsed?.agent ?? 'claude'}
            onLaunch={handleOpenSpaceLaunch}
            onCancel={() => setView('idle')}
          />
        </div>
      )}
    </div>
  )
}

export default App
