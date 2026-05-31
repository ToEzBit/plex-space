import { describe, it, expect } from 'vitest'
import { layoutGeometry } from './layoutGeometry'

describe('layoutGeometry', () => {
  it('1 → 1×1', () => {
    expect(layoutGeometry(1)).toEqual({ cols: 1, rows: 1 })
  })

  it('2 → 2×1 (side-by-side)', () => {
    expect(layoutGeometry(2)).toEqual({ cols: 2, rows: 1 })
  })

  it('4 → 2×2', () => {
    expect(layoutGeometry(4)).toEqual({ cols: 2, rows: 2 })
  })

  it('6 → 3×2', () => {
    expect(layoutGeometry(6)).toEqual({ cols: 3, rows: 2 })
  })

  it('3 → 2×2 grid with bottom pane spanning 2 columns', () => {
    expect(layoutGeometry(3)).toEqual({ cols: 2, rows: 2, paneSpans: [1, 1, 2] })
  })

  it('paneSpans sum equals cols × rows for asymmetric layouts', () => {
    const { cols, rows, paneSpans } = layoutGeometry(3)
    const total = paneSpans!.reduce((a, b) => a + b, 0)
    expect(total).toBe(cols * rows)
  })

  it('cols × rows equals pane count for uniform layouts', () => {
    const sizes = [1, 2, 4, 6] as const
    for (const n of sizes) {
      const { cols, rows } = layoutGeometry(n)
      expect(cols * rows).toBe(n)
    }
  })
})
