import { useState, useRef } from 'react'
import { mouseToProportion } from './paneProportions'
import { Divider } from './Divider'
import { Pane } from './Pane'
import { useDividerDrag } from './useDividerDrag'

interface Props {
  terminalIds: [string, string]
  visible: boolean
}

export function TwoPaneLayout({ terminalIds, visible }: Props): React.JSX.Element {
  const [proportion, setProportion] = useState(0.5)
  const { isDragging, containerCursor, refitTrigger, startDrag, bumpRefit } = useDividerDrag()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDividerMouseDown = startDrag('v', (ev) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setProportion(mouseToProportion(ev.clientX, rect.left, rect.width))
  })

  const handleDividerDoubleClick = (): void => {
    setProportion(0.5)
    bumpRefit()
  }

  const [leftId, rightId] = terminalIds

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        padding: '4px',
        gap: 0,
        background: 'var(--bg)',
        cursor: containerCursor,
        userSelect: isDragging ? 'none' : undefined
      }}
    >
      <Pane
        index={1}
        terminalId={leftId}
        visible={visible}
        isDragging={isDragging}
        refitTrigger={refitTrigger}
        flex={proportion}
      />

      <Divider
        orientation="v"
        isDragging={isDragging}
        onMouseDown={handleDividerMouseDown}
        onDoubleClick={handleDividerDoubleClick}
      />

      <Pane
        index={2}
        terminalId={rightId}
        visible={visible}
        isDragging={isDragging}
        refitTrigger={refitTrigger}
        flex={1 - proportion}
      />
    </div>
  )
}
