export interface LayoutGeometry {
  cols: number
  rows: number
}

const GEOMETRIES: Record<number, LayoutGeometry> = {
  1: { cols: 1, rows: 1 },
  2: { cols: 2, rows: 1 },
  4: { cols: 2, rows: 2 },
  6: { cols: 3, rows: 2 }
}

export const LAYOUT_SIZES = [1, 2, 4, 6] as const
export type LayoutSize = (typeof LAYOUT_SIZES)[number]

export function layoutGeometry(n: LayoutSize): LayoutGeometry {
  return GEOMETRIES[n]
}
