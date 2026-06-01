function initials(name: string): string {
  const parts = name.replace(/[^a-zA-Z0-9 -]/g, '').split(/[\s-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface Props {
  spaces: Space[]
  openSpaceIds: Set<string>
  activeSpaceId: string | null
  open: boolean
  onSelectSpace: (space: Space) => void
  onNewSpace: () => void
  onRemoveSpace: (id: string) => void
}

export default function Sidebar({
  spaces,
  openSpaceIds,
  activeSpaceId,
  open,
  onSelectSpace,
  onNewSpace,
  onRemoveSpace
}: Props): React.JSX.Element {
  return (
    <div className={`sidebar${open ? '' : ' collapsed'}`}>
      <div className="sidebar-header">Spaces</div>
      <div className="sidebar-list">
        {spaces.length === 0 ? (
          <div className="sidebar-empty">No spaces yet</div>
        ) : (
          spaces.map((space) => {
            const isOpen = openSpaceIds.has(space.id)
            const isActive = space.id === activeSpaceId
            return (
              <div
                key={space.id}
                className={`space-item${isOpen ? ' open' : ''}${isActive ? ' active' : ''}`}
                role="button"
                tabIndex={open ? 0 : -1}
                aria-label={`${space.name}${isActive ? ', active' : isOpen ? ', running' : ''}`}
                onClick={() => onSelectSpace(space)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectSpace(space)
                  }
                }}
              >
                <div className="ring-wrap">
                  <div className="initials" aria-hidden="true">
                    {initials(space.name)}
                  </div>
                  <div
                    className="run-dot"
                    aria-label={isActive ? 'active' : isOpen ? 'running' : undefined}
                  />
                </div>
                <div className="space-label">
                  <div className="space-name">{space.name}</div>
                  <div className="space-status">
                    {isOpen ? 'running' : (space.directory.split('/').pop() ?? space.directory)}
                  </div>
                </div>
                <button
                  className="space-item-remove"
                  aria-label={`Remove ${space.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`Remove "${space.name}"?`)) {
                      onRemoveSpace(space.id)
                    }
                  }}
                >
                  ×
                </button>
              </div>
            )
          })
        )}
      </div>
      <div className="sidebar-footer">
        <button className="btn-new-space" onClick={onNewSpace} tabIndex={open ? 0 : -1}>
          <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>
            +
          </span>{' '}
          New Space
        </button>
      </div>
    </div>
  )
}
