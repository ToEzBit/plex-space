import PaneTerminal from './PaneTerminal'
import PaneHeader from './PaneHeader'

interface Props {
  /** 1-based pane number shown in the header. */
  index: number
  terminalId: string
  cwd: string
  branch: string | null
  visible: boolean
  isDragging: boolean
  refitTrigger: number
  /** Flex grow factor for this pane within its row/column. */
  flex: number
  isFullscreen?: boolean
  onEnterFullscreen?: (index: number) => void
  onExitFullscreen?: () => void
  style?: React.CSSProperties
}

/** A single titled terminal pane sized by its `flex` factor within a flex row. */
export function Pane({
  index,
  terminalId,
  cwd,
  branch,
  visible,
  isDragging,
  refitTrigger,
  flex,
  isFullscreen = false,
  onEnterFullscreen,
  onExitFullscreen,
  style
}: Props): React.JSX.Element {
  return (
    <div className="pane-shell" style={{ ...style, flex }}>
      <div className={`pane${isFullscreen ? ' fullscreen' : ''}`}>
        <PaneHeader
          index={index}
          cwd={cwd}
          branch={branch}
          isFullscreen={isFullscreen}
          onEnterFullscreen={() => onEnterFullscreen?.(index)}
          onExitFullscreen={onExitFullscreen}
        />
        <div className="pane-terminal">
          <PaneTerminal
            terminalId={terminalId}
            visible={visible}
            isDragging={isDragging}
            refitTrigger={refitTrigger}
          />
        </div>
      </div>
    </div>
  )
}
