import { describe, it, expect } from 'vitest'
import { calculateLiability, calculateDeficit, estimateCostRange } from '../liability'

describe('calculateLiability', () => {
  it('calculates rigid liability at 30%', () => {
    expect(calculateLiability('rigid', 10_000)).toBe(3_000)
  })

  it('calculates flexible liability at 20%', () => {
    expect(calculateLiability('flexible', 10_000)).toBe(2_000)
  })

  it('calculates MLP liability at 15%', () => {
    expect(calculateLiability('mlp', 10_000)).toBe(1_500)
  })

  it('returns 0 for 0 kg input', () => {
    expect(calculateLiability('rigid', 0)).toBe(0)
  })
})

describe('calculateDeficit', () => {
  it('deficit = liability - secured when secured < liability', () => {
    expect(calculateDeficit(3_000, 1_000)).toBe(2_000)
  })

  it('deficit is 0 when fully secured', () => {
    expect(calculateDeficit(3_000, 3_000)).toBe(0)
  })

  it('deficit is 0 when over-secured', () => {
    expect(calculateDeficit(3_000, 4_000)).toBe(0)
  })
})

describe('estimateCostRange', () => {
  it('returns correct range for rigid', () => {
    expect(estimateCostRange('rigid', 1_000)).toEqual({ min: 12_000, max: 14_000 })
  })

  it('returns correct range for flexible', () => {
    expect(estimateCostRange('flexible', 1_000)).toEqual({ min: 14_000, max: 17_000 })
  })

  it('returns correct range for mlp', () => {
    expect(estimateCostRange('mlp', 1_000)).toEqual({ min: 16_000, max: 20_000 })
  })
})
