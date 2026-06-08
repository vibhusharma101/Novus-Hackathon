import { describe, it, expect } from 'vitest'
import { calculatePricing } from '../pricing'

describe('calculatePricing', () => {
  it('calculates credits cost from qty and price', () => {
    const result = calculatePricing(1_000, 12)
    expect(result.creditsCost).toBe(12_000)
  })

  it('calculates 5% platform fee on credits cost', () => {
    const result = calculatePricing(1_000, 12)
    expect(result.platformFee).toBe(600)
  })

  it('total = credits cost + platform fee', () => {
    const result = calculatePricing(1_000, 12)
    expect(result.total).toBe(12_600)
  })

  it('handles fractional prices correctly', () => {
    const result = calculatePricing(100, 12.40)
    expect(result.creditsCost).toBe(1_240)
    expect(result.platformFee).toBe(62)
    expect(result.total).toBe(1_302)
  })

  it('returns zero values for zero qty', () => {
    const result = calculatePricing(0, 12)
    expect(result.creditsCost).toBe(0)
    expect(result.platformFee).toBe(0)
    expect(result.total).toBe(0)
  })
})
