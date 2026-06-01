import { describe, it, expect } from 'vitest'
import {
  clampProportion,
  mouseToProportion,
  clampSplit,
  mouseXToSplit,
  updateRowSplit,
  splitsToFractions,
  DIVIDER_PX,
  MIN_PANE_PX
} from './paneProportions'

const USABLE = (w: number): number => w - DIVIDER_PX

describe('clampProportion', () => {
  it('returns 0.5 for midpoint', () => {
    expect(clampProportion(0.5, 1000)).toBe(0.5)
  })

  it('clamps a proportion that would push left pane below minimum', () => {
    const w = 1000
    const minFrac = MIN_PANE_PX / USABLE(w)
    expect(clampProportion(0, w)).toBeCloseTo(minFrac)
  })

  it('clamps a proportion that would push right pane below minimum', () => {
    const w = 1000
    const maxFrac = 1 - MIN_PANE_PX / USABLE(w)
    expect(clampProportion(1, w)).toBeCloseTo(maxFrac)
  })

  it('passes through a value already inside the valid range', () => {
    const w = 1000
    expect(clampProportion(0.4, w)).toBeCloseTo(0.4)
  })

  it('returns 0.5 when container is too narrow to fit both panes at minimum', () => {
    // usable = 320 - 6 = 314; minFrac = 160/314 ≈ 0.51 > 0.5 → degenerate
    expect(clampProportion(0.3, 320)).toBe(0.5)
  })

  it('returns 0.5 when container width is zero or negative', () => {
    expect(clampProportion(0.5, 0)).toBe(0.5)
    expect(clampProportion(0.5, -10)).toBe(0.5)
  })

  it('exactly-at-minimum proportion is accepted', () => {
    const w = 1000
    const minFrac = MIN_PANE_PX / USABLE(w)
    expect(clampProportion(minFrac, w)).toBeCloseTo(minFrac)
  })
})

describe('mouseToProportion', () => {
  it('maps the container midpoint to 0.5', () => {
    const w = 1000
    const left = 50
    const mid = left + w / 2
    expect(mouseToProportion(mid, left, w)).toBeCloseTo(0.5, 2)
  })

  it('clamps when mouse is at the far left', () => {
    const w = 1000
    const minFrac = MIN_PANE_PX / USABLE(w)
    expect(mouseToProportion(0, 0, w)).toBeCloseTo(minFrac)
  })

  it('clamps when mouse is at the far right', () => {
    const w = 1000
    const maxFrac = 1 - MIN_PANE_PX / USABLE(w)
    expect(mouseToProportion(w, 0, w)).toBeCloseTo(maxFrac)
  })

  it('applies a custom minPx', () => {
    const w = 1000
    const minPx = 200
    const minFrac = minPx / USABLE(w)
    expect(mouseToProportion(0, 0, w, minPx)).toBeCloseTo(minFrac)
  })
})

describe('clampSplit (2-col, 1 divider)', () => {
  const W = 1000
  const available = W - DIVIDER_PX

  it('midpoint passes through', () => {
    expect(clampSplit(0.5, W, 0, [0.5])).toBeCloseTo(0.5)
  })

  it('clamps raw 0 to minFrac', () => {
    const minFrac = MIN_PANE_PX / available
    expect(clampSplit(0, W, 0, [0.5])).toBeCloseTo(minFrac)
  })

  it('clamps raw 1 to 1 - minFrac', () => {
    const minFrac = MIN_PANE_PX / available
    expect(clampSplit(1, W, 0, [0.5])).toBeCloseTo(1 - minFrac)
  })
})

describe('clampSplit (3-col, 2 dividers)', () => {
  const W = 1200
  const available = W - 2 * DIVIDER_PX
  const minFrac = MIN_PANE_PX / available

  it('divider 0: clamps to leave room for pane 0', () => {
    expect(clampSplit(0, W, 0, [1 / 3, 2 / 3])).toBeCloseTo(minFrac)
  })

  it('divider 1: clamps to leave room for pane 2', () => {
    expect(clampSplit(1, W, 1, [1 / 3, 2 / 3])).toBeCloseTo(1 - minFrac)
  })

  it('divider 0: cannot cross divider 1 minus minFrac', () => {
    const splits = [1 / 3, 0.4]
    const result = clampSplit(0.5, W, 0, splits)
    expect(result).toBeLessThan(splits[1])
    expect(result).toBeCloseTo(splits[1] - minFrac)
  })

  it('divider 1: cannot cross divider 0 plus minFrac', () => {
    const splits = [0.6, 2 / 3]
    const result = clampSplit(0.5, W, 1, splits)
    expect(result).toBeGreaterThan(splits[0])
    expect(result).toBeCloseTo(splits[0] + minFrac)
  })
})

describe('mouseXToSplit', () => {
  it('maps row midpoint to 0.5 for a single divider', () => {
    const W = 1000
    expect(mouseXToSplit(W / 2, 0, W, 0, [0.5])).toBeCloseTo(0.5, 1)
  })

  it('maps first-third position to ~1/3 for two dividers', () => {
    const W = 1200
    expect(mouseXToSplit(W / 3, 0, W, 0, [1 / 3, 2 / 3])).toBeCloseTo(1 / 3, 1)
  })
})

describe('updateRowSplit', () => {
  const initial = [[0.5], [0.5]]

  it('updates the target row and divider', () => {
    const result = updateRowSplit(initial, 0, 0, 0.3)
    expect(result[0][0]).toBeCloseTo(0.3)
  })

  it('leaves the other row unchanged (rows-first independence)', () => {
    const result = updateRowSplit(initial, 0, 0, 0.3)
    expect(result[1]).toBe(initial[1])
  })

  it('updating row 1 leaves row 0 unchanged', () => {
    const result = updateRowSplit(initial, 1, 0, 0.7)
    expect(result[0]).toBe(initial[0])
    expect(result[1][0]).toBeCloseTo(0.7)
  })

  it('rows can hold different split values (ragged columns)', () => {
    let state = updateRowSplit(initial, 0, 0, 0.3)
    state = updateRowSplit(state, 1, 0, 0.7)
    expect(state[0][0]).toBeCloseTo(0.3)
    expect(state[1][0]).toBeCloseTo(0.7)
  })
})

describe('splitsToFractions', () => {
  it('empty splits produces a single full-width fraction (3-pane bottom row invariant)', () => {
    expect(splitsToFractions([])).toEqual([1])
  })

  it('single split produces two equal halves', () => {
    expect(splitsToFractions([0.5])).toEqual([0.5, 0.5])
  })

  it('two equal splits produce three equal thirds', () => {
    const result = splitsToFractions([1 / 3, 2 / 3])
    expect(result).toHaveLength(3)
    result.forEach((f) => expect(f).toBeCloseTo(1 / 3))
  })

  it('asymmetric split sums to 1', () => {
    const result = splitsToFractions([0.3, 0.7])
    const sum = result.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1)
    expect(result[0]).toBeCloseTo(0.3)
    expect(result[1]).toBeCloseTo(0.4)
    expect(result[2]).toBeCloseTo(0.3)
  })
})
