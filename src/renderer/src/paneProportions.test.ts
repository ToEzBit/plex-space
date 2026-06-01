import { describe, it, expect } from 'vitest'
import { clampProportion, mouseXToProportion, DIVIDER_PX, MIN_PANE_PX } from './paneProportions'

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

describe('mouseXToProportion', () => {
  it('maps the container midpoint to 0.5', () => {
    const w = 1000
    const left = 50
    const mid = left + w / 2
    expect(mouseXToProportion(mid, left, w)).toBeCloseTo(0.5, 2)
  })

  it('clamps when mouse is at the far left', () => {
    const w = 1000
    const minFrac = MIN_PANE_PX / USABLE(w)
    expect(mouseXToProportion(0, 0, w)).toBeCloseTo(minFrac)
  })

  it('clamps when mouse is at the far right', () => {
    const w = 1000
    const maxFrac = 1 - MIN_PANE_PX / USABLE(w)
    expect(mouseXToProportion(w, 0, w)).toBeCloseTo(maxFrac)
  })

  it('applies a custom minPx', () => {
    const w = 1000
    const minPx = 200
    const minFrac = minPx / USABLE(w)
    expect(mouseXToProportion(0, 0, w, minPx)).toBeCloseTo(minFrac)
  })
})
