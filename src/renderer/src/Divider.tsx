import { DIVIDER_PX } from './paneProportions'

interface Props {
  /** 'v' = vertical divider between columns; 'h' = horizontal divider between rows. */
  orientation: 'h' | 'v'
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onDoubleClick: () => void
}

/** The draggable separator shared by every resizable layout. */
export function Divider({ orientation, isDragging, onMouseDown, onDoubleClick }: Props): React.JSX.Element {
  const isHorizontal = orientation === 'h'
  return (
    <div
      role="separator"
      aria-label={
        isHorizontal
          ? 'Drag to resize rows; double-click to reset'
          : 'Drag to resize panes; double-click to reset'
      }
      style={{
        ...(isHorizontal ? { height: DIVIDER_PX } : { width: DIVIDER_PX }),
        flexShrink: 0,
        background: isDragging ? 'var(--accent)' : 'var(--border)',
        cursor: isHorizontal ? 'row-resize' : 'col-resize',
        transition: 'background 120ms'
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    />
  )
}
