import { useState, useRef } from 'react'
import { mouseToProportion, MIN_PANE_HEIGHT_PX } from './paneProportions'
import { Divider } from './Divider'
import { Pane } from './Pane'
import { useDividerDrag } from './useDividerDrag'

interface Props {
  terminalIds: [string, string, string]
  visible: boolean
}

export function ThreePaneLayout({ terminalIds, visible }: Props): React.JSX.Element {
  const [rowProportion, setRowProportion] = useState(0.5)
  const [topProportion, setTopProportion] = useState(0.5)
  const { isDragging, containerCursor, refitTrigger, startDrag, bumpRefit } = useDividerDrag()

  const containerRef = useRef<HTMLDivElement>(null)
  const topRowRef = useRef<HTMLDivElement>(null)

  const handleHDividerMouseDown = startDrag('h', (ev) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setRowProportion(mouseToProportion(ev.clientY, rect.top, rect.height, MIN_PANE_HEIGHT_PX))
  })

  const handleVDividerMouseDown = startDrag('v', (ev) => {
    const topRow = topRowRef.current
    if (!topRow) return
    const rect = topRow.getBoundingClientRect()
    setTopProportion(mouseToProportion(ev.clientX, rect.left, rect.width))
  })

  const handleHDividerDoubleClick = (): void => {
    setRowProportion(0.5)
    bumpRefit()
  }

  const handleVDividerDoubleClick = (): void => {
    setTopProportion(0.5)
    bumpRefit()
  }

  const [topLeftId, topRightId, bottomId] = terminalIds

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '4px',
        gap: 0,
        background: 'var(--bg)',
        cursor: containerCursor,
        userSelect: isDragging ? 'none' : undefined
      }}
    >
      <div
        ref={topRowRef}
        style={{ flex: rowProportion, display: 'flex', overflow: 'hidden', minHeight: 0 }}
      >
        <Pane
          index={1}
          terminalId={topLeftId}
          visible={visible}
          isDragging={isDragging}
          refitTrigger={refitTrigger}
          flex={topProportion}
        />
        <Divider
          orientation="v"
          isDragging={isDragging}
          onMouseDown={handleVDividerMouseDown}
          onDoubleClick={handleVDividerDoubleClick}
        />
        <Pane
          index={2}
          terminalId={topRightId}
          visible={visible}
          isDragging={isDragging}
          refitTrigger={refitTrigger}
          flex={1 - topProportion}
        />
      </div>

      <Divider
        orientation="h"
        isDragging={isDragging}
        onMouseDown={handleHDividerMouseDown}
        onDoubleClick={handleHDividerDoubleClick}
      />

      <Pane
        index={3}
        terminalId={bottomId}
        visible={visible}
        isDragging={isDragging}
        refitTrigger={refitTrigger}
        flex={1 - rowProportion}
      />
    </div>
  )
}
