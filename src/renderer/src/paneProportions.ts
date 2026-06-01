export const DIVIDER_PX = 6
export const MIN_PANE_PX = 160

/**
 * Clamp a raw proportion (left fraction of usable width) so neither pane
 * falls below minPx pixels. Returns 0.5 when the container is too narrow
 * to satisfy the minimum on both sides.
 */
export function clampProportion(raw: number, containerWidth: number, minPx = MIN_PANE_PX): number {
  const usable = containerWidth - DIVIDER_PX
  if (usable <= 0) return 0.5
  const minFrac = minPx / usable
  const maxFrac = 1 - minFrac
  if (minFrac >= maxFrac) return 0.5
  return Math.max(minFrac, Math.min(maxFrac, raw))
}

/**
 * Convert a mouse X position to a clamped proportion for the left pane.
 * containerLeft and containerWidth come from getBoundingClientRect().
 */
export function mouseXToProportion(
  mouseX: number,
  containerLeft: number,
  containerWidth: number,
  minPx = MIN_PANE_PX
): number {
  const usable = containerWidth - DIVIDER_PX
  if (usable <= 0) return 0.5
  const raw = (mouseX - containerLeft) / usable
  return clampProportion(raw, containerWidth, minPx)
}
