import { useCallback, useState } from 'react'

export type DragType = 'h' | 'v'

/**
 * Owns the divider-drag lifecycle shared by every resizable layout:
 * preventDefault on mousedown, track which axis is dragging, attach/detach the
 * window mousemove + mouseup listeners, and bump a refit trigger on release so
 * terminals re-fit to their new size. The per-pixel position math stays in the
 * caller's `onMove` callback (it varies per layout); the hook never touches
 * layout state itself.
 */
export function useDividerDrag(): {
  isDragging: boolean
  /** CSS cursor for the container while a drag is active (axis-aware). */
  containerCursor: 'row-resize' | 'col-resize' | undefined
  refitTrigger: number
  /** Build an onMouseDown handler for a divider of the given axis. */
  startDrag: (type: DragType, onMove: (ev: MouseEvent) => void) => (e: React.MouseEvent) => void
  /** Bump the refit trigger directly (e.g. from a double-click reset). */
  bumpRefit: () => void
} {
  const [dragType, setDragType] = useState<DragType | null>(null)
  const [refitTrigger, setRefitTrigger] = useState(0)
  const bumpRefit = useCallback(() => setRefitTrigger((t) => t + 1), [])

  const startDrag = useCallback(
    (type: DragType, onMove: (ev: MouseEvent) => void) =>
      (e: React.MouseEvent): void => {
        e.preventDefault()
        setDragType(type)
        const onMouseUp = (): void => {
          setDragType(null)
          bumpRefit()
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onMouseUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onMouseUp)
      },
    [bumpRefit]
  )

  const containerCursor =
    dragType === 'h' ? 'row-resize' : dragType === 'v' ? 'col-resize' : undefined

  return { isDragging: dragType !== null, containerCursor, refitTrigger, startDrag, bumpRefit }
}
