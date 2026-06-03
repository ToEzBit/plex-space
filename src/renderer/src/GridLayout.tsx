import { Fragment, useState, useRef } from 'react'
import {
  mouseToProportion,
  mouseXToSplit,
  updateRowSplit,
  splitsToFractions,
  MIN_PANE_HEIGHT_PX
} from './paneProportions'
import { Divider } from './Divider'
import { Pane } from './Pane'
import { useDividerDrag } from './useDividerDrag'

interface Props {
  cols: 2 | 3
  terminalIds: string[]
  paneCwds: string[]
  paneBranches: Array<string | null>
  visible: boolean
  fullscreenPaneIndex: number | null
  onEnterFullscreen: (index: number) => void
  onExitFullscreen: () => void
}

function equalSplits(cols: number): number[] {
  return Array.from({ length: cols - 1 }, (_, i) => (i + 1) / cols)
}

export function GridLayout({
  cols,
  terminalIds,
  paneCwds,
  paneBranches,
  visible,
  fullscreenPaneIndex,
  onEnterFullscreen,
  onExitFullscreen
}: Props): React.JSX.Element {
  const init = equalSplits(cols)
  const [rowProportion, setRowProportion] = useState(0.5)
  const [rowSplits, setRowSplits] = useState<number[][]>([init, [...init]])
  const { isDragging, containerCursor, refitTrigger, startDrag, bumpRefit } =
    useDividerDrag()

  const containerRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([null, null])

  const handleHDividerMouseDown = startDrag('h', (ev) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setRowProportion(
      mouseToProportion(ev.clientY, rect.top, rect.height, MIN_PANE_HEIGHT_PX)
    )
  })

  const handleVDividerMouseDown = (
    rowIndex: number,
    dividerIndex: number
  ): ((e: React.MouseEvent) => void) =>
    startDrag('v', (ev) => {
      const rowEl = rowRefs.current[rowIndex]
      if (!rowEl) return
      const rect = rowEl.getBoundingClientRect()
      setRowSplits((prev) => {
        const newPos = mouseXToSplit(
          ev.clientX,
          rect.left,
          rect.width,
          dividerIndex,
          prev[rowIndex]
        )
        return updateRowSplit(prev, rowIndex, dividerIndex, newPos)
      })
    })

  const handleHDividerDoubleClick = (): void => {
    setRowProportion(0.5)
    bumpRefit()
  }

  const handleVDividerDoubleClick = (rowIndex: number): void => {
    setRowSplits((prev) =>
      prev.map((row, r) => (r === rowIndex ? equalSplits(cols) : row))
    )
    bumpRefit()
  }

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
        minHeight: 0,
        cursor: containerCursor,
        userSelect: isDragging ? 'none' : undefined
      }}
    >
      {([0, 1] as const).map((rowIndex) => {
        const fracs = splitsToFractions(rowSplits[rowIndex])
        const paneOffset = rowIndex * cols
        return (
          <Fragment key={rowIndex}>
            <div
              ref={(el) => {
                rowRefs.current[rowIndex] = el
              }}
              style={{
                flex: rowIndex === 0 ? rowProportion : 1 - rowProportion,
                display: 'flex',
                overflow: 'hidden',
                minHeight: 0
              }}
            >
              {fracs.map((frac, colIndex) => (
                <Fragment key={colIndex}>
                  <Pane
                    index={paneOffset + colIndex + 1}
                    terminalId={terminalIds[paneOffset + colIndex]}
                    cwd={paneCwds[paneOffset + colIndex]}
                    branch={paneBranches[paneOffset + colIndex] ?? null}
                    visible={visible}
                    isDragging={isDragging}
                    refitTrigger={refitTrigger}
                    flex={frac}
                    isFullscreen={
                      fullscreenPaneIndex === paneOffset + colIndex + 1
                    }
                    onEnterFullscreen={onEnterFullscreen}
                    onExitFullscreen={onExitFullscreen}
                  />
                  {colIndex < cols - 1 && (
                    <Divider
                      orientation="v"
                      isDragging={isDragging}
                      onMouseDown={handleVDividerMouseDown(rowIndex, colIndex)}
                      onDoubleClick={() => handleVDividerDoubleClick(rowIndex)}
                    />
                  )}
                </Fragment>
              ))}
            </div>
            {rowIndex === 0 && (
              <Divider
                orientation="h"
                isDragging={isDragging}
                onMouseDown={handleHDividerMouseDown}
                onDoubleClick={handleHDividerDoubleClick}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
