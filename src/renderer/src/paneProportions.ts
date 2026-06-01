export const DIVIDER_PX = 6
export const MIN_PANE_PX = 160
export const MIN_PANE_HEIGHT_PX = 90

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
 * Convert a mouse position along one axis to a clamped proportion for the first
 * pane. `start` and `extent` are the container's offset and size along that axis
 * (left/width for a vertical divider, top/height for a horizontal one), read
 * from getBoundingClientRect().
 */
export function mouseToProportion(
  pos: number,
  start: number,
  extent: number,
  minPx = MIN_PANE_PX
): number {
  const raw = (pos - start) / Math.max(1, extent - DIVIDER_PX)
  return clampProportion(raw, extent, minPx)
}

/**
 * Clamp a new cumulative split position for divider `dividerIndex` in a row.
 * `splits` contains all cumulative divider positions for the row as fractions.
 * `rowWidth` is the total pixel width of the row container.
 */
export function clampSplit(
  raw: number,
  rowWidth: number,
  dividerIndex: number,
  splits: number[],
  minPx = MIN_PANE_PX
): number {
  const available = rowWidth - splits.length * DIVIDER_PX
  if (available <= 0) return splits[dividerIndex]
  const minFrac = minPx / available
  const lo = dividerIndex > 0 ? splits[dividerIndex - 1] + minFrac : minFrac
  const hi = dividerIndex < splits.length - 1 ? splits[dividerIndex + 1] - minFrac : 1 - minFrac
  if (lo >= hi) return (lo + hi) / 2
  return Math.max(lo, Math.min(hi, raw))
}

/**
 * Convert a mouse X position to a clamped cumulative split for divider `dividerIndex`.
 * `splits` is the current array of all cumulative divider positions for the row.
 */
export function mouseXToSplit(
  mouseX: number,
  rowLeft: number,
  rowWidth: number,
  dividerIndex: number,
  splits: number[],
  minPx = MIN_PANE_PX
): number {
  const available = rowWidth - splits.length * DIVIDER_PX
  const raw = (mouseX - rowLeft) / Math.max(1, available)
  return clampSplit(raw, rowWidth, dividerIndex, splits, minPx)
}

/**
 * Return a new rowSplits array with splits[rowIndex][dividerIndex] replaced by newPos.
 * All other rows are unchanged (rows-first independence guarantee).
 */
export function updateRowSplit(
  rowSplits: number[][],
  rowIndex: number,
  dividerIndex: number,
  newPos: number
): number[][] {
  return rowSplits.map((row, r) =>
    r !== rowIndex ? row : row.map((s, d) => (d === dividerIndex ? newPos : s))
  )
}

/**
 * Convert an array of cumulative split positions to per-pane flex fractions.
 * splits=[0.5] → [0.5, 0.5]; splits=[1/3, 2/3] → [1/3, 1/3, 1/3].
 */
export function splitsToFractions(splits: number[]): number[] {
  const fracs: number[] = []
  let prev = 0
  for (const s of splits) {
    fracs.push(s - prev)
    prev = s
  }
  fracs.push(1 - prev)
  return fracs
}
