interface Props {
  spaces: Space[]
  openSpaceIds: Set<string>
  onNewSpace: () => void
  onOpenSpace: (space: Space) => void
  onCloseSpace: (id: string) => void
  onRemoveSpace: (id: string) => void
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    background: 'var(--bg)',
    color: 'var(--text)',
    display: 'flex',
    flexDirection: 'column' as const
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)'
  },
  appTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text)' },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 24px'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    marginBottom: 8
  },
  rowInfo: { flex: 1, minWidth: 0 },
  spaceName: { fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 },
  spaceDir: {
    fontSize: 12,
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  runningBadge: {
    fontSize: 11,
    color: 'var(--success)',
    border: '1px solid var(--success)',
    borderRadius: 10,
    padding: '2px 7px',
    marginLeft: 8,
    flexShrink: 0
  }
}

const rowBtnSize: React.CSSProperties = { padding: '4px 10px', fontSize: 12, marginLeft: 12, flexShrink: 0 }

export default function SpaceList({
  spaces,
  openSpaceIds,
  onNewSpace,
  onOpenSpace,
  onCloseSpace,
  onRemoveSpace
}: Props): React.JSX.Element {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.appTitle}>Plex Space</span>
        <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={onNewSpace}>
          New Space
        </button>
      </div>
      <div style={styles.list}>
        {spaces.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-glyph">◻</div>
            <div className="empty-state-title">No spaces yet</div>
            <div className="empty-state-sub">Click New Space to create your first terminal grid</div>
          </div>
        ) : (
          spaces.map((space) => (
            <SpaceRow
              key={space.id}
              space={space}
              running={openSpaceIds.has(space.id)}
              onOpen={() => onOpenSpace(space)}
              onClose={(e) => {
                e.stopPropagation()
                onCloseSpace(space.id)
              }}
              onRemove={(e) => {
                e.stopPropagation()
                onRemoveSpace(space.id)
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SpaceRow({
  space,
  running,
  onOpen,
  onClose,
  onRemove
}: {
  space: Space
  running: boolean
  onOpen: () => void
  onClose: (e: React.MouseEvent) => void
  onRemove: (e: React.MouseEvent) => void
}): React.JSX.Element {
  return (
    <div
      className="space-row"
      style={styles.row}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <div style={styles.rowInfo}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={styles.spaceName}>{space.name}</span>
          {running && <span style={styles.runningBadge}>running</span>}
        </div>
        <div className="space-dir" style={styles.spaceDir}>{space.directory}</div>
      </div>
      {running && (
        <button className="btn-danger" style={rowBtnSize} onClick={onClose}>
          Close
        </button>
      )}
      <button className="btn-secondary" style={rowBtnSize} onClick={onRemove}>
        Remove
      </button>
    </div>
  )
}
