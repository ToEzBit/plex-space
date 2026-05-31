import { useState, useEffect } from 'react'
import PaneTerminal from './PaneTerminal'
import { layoutGeometry } from './layoutGeometry'
import NewSpaceWizard, { type SpaceConfig } from './NewSpaceWizard'
import SpaceList from './SpaceList'

const topBarBtnSize = { padding: '3px 10px', fontSize: 12 }

const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 12px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    flexShrink: 0
  },
  spaceName: {
    color: 'var(--text)',
    fontWeight: 500
  },
  paneArea: {
    flex: 1,
    background: 'var(--bg)',
    display: 'grid',
    gap: 0,
    padding: '4px'
  }
}

type View = 'list' | 'new-wizard' | 'open-wizard' | 'grid'

interface OpenSpaceEntry {
  config: SpaceConfig
  terminalIds: string[]
}

function App(): React.JSX.Element {
  const [view, setView] = useState<View>('list')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [lastUsed, setLastUsedState] = useState<LastUsed | null>(null)
  const [pendingSpace, setPendingSpace] = useState<Space | null>(null)
  const [openSpaces, setOpenSpaces] = useState<Record<string, OpenSpaceEntry>>({})
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([window.spaceAPI.listSpaces(), window.spaceAPI.getLastUsed()]).then(([s, lu]) => {
      setSpaces(s)
      setLastUsedState(lu)
    })
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
    setView('grid')
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

  async function handleOpenSpace(space: Space): Promise<void> {
    if (openSpaces[space.id]) {
      setActiveSpaceId(space.id)
      setView('grid')
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
    if (activeSpaceId === spaceId) setView('list')
  }

  async function handleRemoveSpace(id: string): Promise<void> {
    if (openSpaces[id]) {
      await handleCloseSpace(id)
    }
    await window.spaceAPI.removeSpace(id)
    setSpaces((prev) => prev.filter((s) => s.id !== id))
  }

  const openSpaceIds = new Set(Object.keys(openSpaces))

  return (
    <>
      {Object.entries(openSpaces).map(([spaceId, { config, terminalIds }]) => {
        const isActive = view === 'grid' && spaceId === activeSpaceId
        const { cols, rows, paneSpans } = layoutGeometry(config.layout)
        return (
          <div
            key={spaceId}
            style={{ display: isActive ? 'flex' : 'none', flexDirection: 'column', width: '100vw', height: '100vh' }}
          >
            <div style={styles.topBar}>
              <span style={styles.spaceName}>{config.name}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-danger" style={topBarBtnSize} onClick={() => handleCloseSpace(spaceId)}>
                  Close Space
                </button>
                <button className="btn-secondary" style={topBarBtnSize} onClick={() => setView('list')}>
                  Space List
                </button>
              </div>
            </div>
            <div
              style={{
                ...styles.paneArea,
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

      {view === 'list' && (
        <SpaceList
          spaces={spaces}
          openSpaceIds={openSpaceIds}
          onNewSpace={() => setView('new-wizard')}
          onOpenSpace={handleOpenSpace}
          onCloseSpace={handleCloseSpace}
          onRemoveSpace={handleRemoveSpace}
        />
      )}

      {view === 'new-wizard' && (
        <NewSpaceWizard
          mode="new"
          initialLayout={lastUsed?.layout ?? 4}
          initialAgent={lastUsed?.agent ?? 'claude'}
          onLaunch={handleNewSpaceLaunch}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'open-wizard' && pendingSpace && (
        <NewSpaceWizard
          mode="open"
          spaceName={pendingSpace.name}
          spaceCwd={pendingSpace.directory}
          initialLayout={lastUsed?.layout ?? 4}
          initialAgent={lastUsed?.agent ?? 'claude'}
          onLaunch={handleOpenSpaceLaunch}
          onCancel={() => setView('list')}
        />
      )}
    </>
  )
}

export default App
