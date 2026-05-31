import type { Layout } from '../../shared/layout'

export type { Layout }

export interface LayoutGeometry {
  cols: number
  rows: number
  paneSpans?: number[]
}

const GEOMETRIES: Record<Layout, LayoutGeometry> = {
  1: { cols: 1, rows: 1 },
  2: { cols: 2, rows: 1 },
  3: { cols: 2, rows: 2, paneSpans: [1, 1, 2] },
  4: { cols: 2, rows: 2 },
  6: { cols: 3, rows: 2 }
}

export function layoutGeometry(n: Layout): LayoutGeometry {
  return GEOMETRIES[n]
}
