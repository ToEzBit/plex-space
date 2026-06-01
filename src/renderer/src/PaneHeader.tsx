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

interface Props {
  index: number
}

function PaneHeader({ index }: Props): React.JSX.Element {
  return (
    <div className="pane-header">
      <span>Pane {index}</span>
      <div className="pane-header-actions">
        <button type="button" title="Open in VS Code" aria-label="Open in VS Code">
          <CodeIcon />
        </button>
        <button type="button" title="Fullscreen Pane" aria-label="Fullscreen Pane">
          <ExpandIcon />
        </button>
      </div>
    </div>
  )
}

export default PaneHeader
