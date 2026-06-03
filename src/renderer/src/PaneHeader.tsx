function CodeIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m5.75 3.5-4 4.5 4 4.5M10.25 3.5l4 4.5-4 4.5M9.25 2 6.75 14" />
    </svg>
  )
}

function ExpandIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 2H2v4M10 2h4v4M14 10v4h-4M6 14H2v-4M2 6l4-4M10 2l4 4M14 10l-4 4M6 14l-4-4" />
    </svg>
  )
}

function CollapseIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 1v4H1M11 1v4h4M15 11h-4v4M1 11h4v4M1 5l4-4M11 1l4 4M15 11l-4 4M5 15l-4-4" />
    </svg>
  )
}

interface Props {
  index: number
  cwd: string
  branch: string | null
  isFullscreen?: boolean
  onEnterFullscreen?: () => void
  onExitFullscreen?: () => void
}

function PaneHeader({
  index,
  cwd,
  branch,
  isFullscreen = false,
  onEnterFullscreen,
  onExitFullscreen
}: Props): React.JSX.Element {
  async function handleOpenInVSCode(): Promise<void> {
    try {
      await window.spaceAPI.openInVSCode(cwd)
    } catch {
      window.alert(
        'Could not open VS Code. Install Visual Studio Code or the `code` CLI and try again.'
      )
    }
  }

  const label = branch ?? `Pane ${index}`
  const fullscreenLabel = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Pane'

  return (
    <div className="pane-header">
      <span
        className="pane-header-label"
        title={branch ? `Branch: ${branch}` : `Pane ${index}`}
      >
        {label}
      </span>
      <div className="pane-header-actions">
        <button
          type="button"
          title="Open in VS Code"
          aria-label="Open in VS Code"
          onClick={handleOpenInVSCode}
        >
          <CodeIcon />
        </button>
        <button
          type="button"
          title={fullscreenLabel}
          aria-label={fullscreenLabel}
          onClick={isFullscreen ? onExitFullscreen : onEnterFullscreen}
        >
          {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
        </button>
      </div>
    </div>
  )
}

export default PaneHeader
