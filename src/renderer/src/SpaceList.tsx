import { useState } from 'react'

interface Props {
  spaces: Space[]
  onNewSpace: () => void
  onOpenSpace: (space: Space) => void
  onRemoveSpace: (id: string) => void
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    background: '#1e1e1e',
    color: '#e0e0e0',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column' as const
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid #333'
  },
  appTitle: { fontSize: 16, fontWeight: 600, color: '#e0e0e0' },
  newBtn: {
    background: '#0066cc',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    padding: '7px 16px',
    fontSize: 13,
    cursor: 'pointer'
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 24px'
  },
  empty: {
    color: '#666',
    fontSize: 14,
    marginTop: 40,
    textAlign: 'center' as const
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    marginBottom: 8,
    background: '#2d2d2d',
    borderRadius: 6,
    cursor: 'pointer',
    border: '1px solid transparent'
  },
  rowHovered: {
    background: '#353535',
    border: '1px solid #444'
  },
  rowInfo: { flex: 1, minWidth: 0 },
  spaceName: { fontSize: 14, fontWeight: 500, color: '#e0e0e0', marginBottom: 2 },
  spaceDir: {
    fontSize: 12,
    color: '#888',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  removeBtn: {
    background: 'transparent',
    border: '1px solid #555',
    borderRadius: 4,
    color: '#888',
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    marginLeft: 12,
    flexShrink: 0
  }
}

export default function SpaceList({
  spaces,
  onNewSpace,
  onOpenSpace,
  onRemoveSpace
}: Props): React.JSX.Element {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.appTitle}>Plex Space</span>
        <button style={styles.newBtn} onClick={onNewSpace}>
          New Space
        </button>
      </div>
      <div style={styles.list}>
        {spaces.length === 0 ? (
          <div style={styles.empty}>No spaces yet. Create one to get started.</div>
        ) : (
          spaces.map((space) => (
            <SpaceRow
              key={space.id}
              space={space}
              onOpen={() => onOpenSpace(space)}
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
  onOpen,
  onRemove
}: {
  space: Space
  onOpen: () => void
  onRemove: (e: React.MouseEvent) => void
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={hovered ? { ...styles.row, ...styles.rowHovered } : styles.row}
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.rowInfo}>
        <div style={styles.spaceName}>{space.name}</div>
        <div style={styles.spaceDir}>{space.directory}</div>
      </div>
      <button style={styles.removeBtn} onClick={onRemove}>
        Remove
      </button>
    </div>
  )
}
