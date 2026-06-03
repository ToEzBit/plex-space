import appIcon from '../../../assets/icon.png'

function initials(name: string): string {
  const parts = name
    .replace(/[^a-zA-Z0-9 -]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface Props {
  spaces: Space[]
  openSpaceIds: Set<string>
  activeSpaceId: string | null
  open: boolean
  onSelectSpace: (space: Space) => void
  onOpenOverview: () => void
  onRemoveSpace: (id: string) => void
}

export default function Sidebar({
  spaces,
  openSpaceIds,
  activeSpaceId,
  open,
  onSelectSpace,
  onOpenOverview,
  onRemoveSpace
}: Props): React.JSX.Element {
  return (
    <div className={`sidebar${open ? '' : ' collapsed'}`}>
      <div className="sidebar-drag-region" aria-hidden="true" />
      <button
        className="sidebar-brand"
        type="button"
        tabIndex={open ? 0 : -1}
        title="Back to Space overview"
        aria-label="Back to Space overview"
        onClick={onOpenOverview}
      >
        <img src={appIcon} alt="" />
        <span>
          <strong>Plex Space</strong>
          <small>Space overview</small>
        </span>
      </button>

      <section className="sidebar-section sidebar-spaces">
        <div className="sidebar-header">
          <span>Spaces</span>
          <span>{spaces.length}</span>
        </div>
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
      </section>
    </div>
  )
}
