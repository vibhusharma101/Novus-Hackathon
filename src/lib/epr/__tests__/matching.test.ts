import { describe, it, expect } from 'vitest'
import { matchOrder } from '../matching'

describe('matchOrder', () => {
  it('fills full deficit when listing has enough qty', () => {
    const result = matchOrder({ deficitKg: 5_000, listingQty: 8_000, pricePerKg: 12 })
    expect(result.orderQty).toBe(5_000)
    expect(result.residualDeficit).toBe(0)
  })

  it('caps order at listing qty when deficit exceeds supply', () => {
    const result = matchOrder({ deficitKg: 10_000, listingQty: 6_000, pricePerKg: 12 })
    expect(result.orderQty).toBe(6_000)
    expect(result.residualDeficit).toBe(4_000)
  })

  it('exact match — zero residual', () => {
    const result = matchOrder({ deficitKg: 3_000, listingQty: 3_000, pricePerKg: 14 })
    expect(result.orderQty).toBe(3_000)
    expect(result.residualDeficit).toBe(0)
  })

  it('includes pricing in result', () => {
    const result = matchOrder({ deficitKg: 1_000, listingQty: 5_000, pricePerKg: 12 })
    expect(result.creditsCost).toBe(12_000)
    expect(result.platformFee).toBe(600)
    expect(result.total).toBe(12_600)
  })

  it('returns zero order for zero deficit', () => {
    const result = matchOrder({ deficitKg: 0, listingQty: 5_000, pricePerKg: 12 })
    expect(result.orderQty).toBe(0)
    expect(result.residualDeficit).toBe(0)
  })
})
