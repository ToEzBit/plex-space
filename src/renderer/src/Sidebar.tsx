import { useEffect, useState } from 'react'
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
  taskCountsBySpaceId: Map<string, number>
  onSelectSpace: (space: Space) => void
  onOpenOverview: () => void
  onRemoveSpace: (id: string) => void
}

export default function Sidebar({
  spaces,
  openSpaceIds,
  activeSpaceId,
  open,
  taskCountsBySpaceId,
  onSelectSpace,
  onOpenOverview,
  onRemoveSpace
}: Props): React.JSX.Element {
  const [tasksOpen, setTasksOpen] = useState(false)
  const activeSpace = activeSpaceId ? spaces.find((space) => space.id === activeSpaceId) : null
  const activeTaskCount = activeSpaceId ? (taskCountsBySpaceId.get(activeSpaceId) ?? 0) : 0

  useEffect(() => {
    if (!tasksOpen) return

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setTasksOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tasksOpen])

  return (
    <div className={`sidebar${open ? '' : ' collapsed'}`}>
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
              const taskCount = taskCountsBySpaceId.get(space.id) ?? 0
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
                  {taskCount > 0 && <div className="space-task-count">{taskCount}</div>}
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

      <section className="sidebar-section sidebar-tasks">
        <div className="active-tasks-header">
          <div>
            <span>Active Space Tasks</span>
            <strong>{activeSpace?.name ?? 'No active Space'}</strong>
          </div>
          <span className="active-task-count">{activeTaskCount}</span>
        </div>
        <div className="active-tasks-scroll">
          <div className="active-tasks-empty">
            {activeSpace ? 'No tasks yet' : 'Select a Space to see its tasks'}
          </div>
        </div>
        <button
          className="btn-view-tasks"
          type="button"
          disabled={!activeSpace}
          tabIndex={open ? 0 : -1}
          onClick={() => setTasksOpen(true)}
        >
          View all tasks
        </button>
      </section>

      {tasksOpen && (
        <div
          className="task-drawer-backdrop"
          role="presentation"
          onClick={() => setTasksOpen(false)}
        >
          <section
            className="task-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-drawer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="task-drawer-header">
              <div>
                <strong id="task-drawer-title">
                  {activeSpace ? `${activeSpace.name} Tasks` : 'Space Tasks'}
                </strong>
                <span>{activeTaskCount} tasks tied to the active Space</span>
              </div>
              <button
                className="task-drawer-close"
                type="button"
                aria-label="Close task list"
                onClick={() => setTasksOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="task-drawer-empty">No tasks yet</div>
          </section>
        </div>
      )}
    </div>
  )
}
