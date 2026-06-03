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
  flex
}: Props): React.JSX.Element {
  return (
    <div style={{ flex, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
      <div className="pane">
        <PaneHeader index={index} cwd={cwd} branch={branch} />
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
