import { useState } from 'react'

const _rowBtn = {
  background: 'transparent',
  borderRadius: 4,
  padding: '4px 10px',
  fontSize: 12,
  cursor: 'pointer',
  marginLeft: 12,
  flexShrink: 0
}

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
    fontFamily: "'JetBrainsMono NFM', ui-monospace, Menlo, monospace",
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
  newBtn: {
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 4,
    color: 'var(--on-accent)',
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
    color: 'var(--text-muted)',
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
    background: 'var(--surface)',
    borderRadius: 6,
    cursor: 'pointer',
    border: '1px solid transparent'
  },
  rowHovered: {
    background: 'var(--elevated)',
    border: '1px solid var(--border-strong)'
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
  removeBtn: { ..._rowBtn, border: '1px solid var(--border)', color: 'var(--text-secondary)' },
  stopBtn: { ..._rowBtn, border: '1px solid var(--danger)', color: 'var(--danger)' },
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
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={hovered ? { ...styles.row, ...styles.rowHovered } : styles.row}
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.rowInfo}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={styles.spaceName}>{space.name}</span>
          {running && <span style={styles.runningBadge}>running</span>}
        </div>
        <div style={hovered ? { ...styles.spaceDir, color: 'var(--text-secondary)' } : styles.spaceDir}>{space.directory}</div>
      </div>
      {running && (
        <button style={styles.stopBtn} onClick={onClose}>
          Close
        </button>
      )}
      <button style={styles.removeBtn} onClick={onRemove}>
        Remove
      </button>
    </div>
  )
}
