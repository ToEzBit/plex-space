import { useState, useRef, useCallback } from 'react'
import PaneTerminal from './PaneTerminal'
import PaneHeader from './PaneHeader'
import { mouseXToProportion, DIVIDER_PX } from './paneProportions'

interface Props {
  terminalIds: [string, string]
  visible: boolean
}

export function TwoPaneLayout({ terminalIds, visible }: Props): React.JSX.Element {
  const [proportion, setProportion] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)
  const [refitTrigger, setRefitTrigger] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    setIsDragging(true)

    const rect = container.getBoundingClientRect()
    const onMouseMove = (ev: MouseEvent): void => {
      setProportion(mouseXToProportion(ev.clientX, rect.left, rect.width))
    }

    const onMouseUp = (): void => {
      setIsDragging(false)
      setRefitTrigger((t) => t + 1)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  const handleDividerDoubleClick = (): void => {
    setProportion(0.5)
    setRefitTrigger((t) => t + 1)
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
        cursor: isDragging ? 'col-resize' : undefined,
        userSelect: isDragging ? 'none' : undefined
      }}
    >
      <div className="pane" style={{ flex: proportion, minWidth: 0 }}>
        <PaneHeader index={1} />
        <div className="pane-terminal">
          <PaneTerminal
            terminalId={leftId}
            visible={visible}
            isDragging={isDragging}
            refitTrigger={refitTrigger}
          />
        </div>
      </div>

      <div
        role="separator"
        aria-label="Drag to resize panes; double-click to reset"
        style={{
          width: DIVIDER_PX,
          flexShrink: 0,
          background: isDragging ? 'var(--accent)' : 'var(--border)',
          cursor: 'col-resize',
          transition: 'background 120ms'
        }}
        onMouseDown={handleDividerMouseDown}
        onDoubleClick={handleDividerDoubleClick}
      />

      <div className="pane" style={{ flex: 1 - proportion, minWidth: 0 }}>
        <PaneHeader index={2} />
        <div className="pane-terminal">
          <PaneTerminal
            terminalId={rightId}
            visible={visible}
            isDragging={isDragging}
            refitTrigger={refitTrigger}
          />
        </div>
      </div>
    </div>
  )
}
