import { describe, it, expect } from 'vitest'
import { listingSchema, LISTING_MIN_KG, LISTING_MAX_KG } from '../listing'

const valid = { category: 'rigid' as const, qty_kg: 8_000, price_per_kg: 12.4 }

describe('listingSchema', () => {
  it('accepts a well-formed listing', () => {
    expect(listingSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an unknown category', () => {
    expect(listingSchema.safeParse({ ...valid, category: 'glass' }).success).toBe(false)
  })

  it('enforces the minimum quantity (5 MT)', () => {
    expect(listingSchema.safeParse({ ...valid, qty_kg: LISTING_MIN_KG - 1 }).success).toBe(false)
    expect(listingSchema.safeParse({ ...valid, qty_kg: LISTING_MIN_KG }).success).toBe(true)
  })

  it('enforces the maximum quantity (500 MT)', () => {
    expect(listingSchema.safeParse({ ...valid, qty_kg: LISTING_MAX_KG + 1 }).success).toBe(false)
    expect(listingSchema.safeParse({ ...valid, qty_kg: LISTING_MAX_KG }).success).toBe(true)
  })

  it('rejects non-positive or NaN price', () => {
    expect(listingSchema.safeParse({ ...valid, price_per_kg: 0 }).success).toBe(false)
    expect(listingSchema.safeParse({ ...valid, price_per_kg: -5 }).success).toBe(false)
    expect(listingSchema.safeParse({ ...valid, price_per_kg: NaN }).success).toBe(false)
  })

  it('rejects an unrealistically high price', () => {
    expect(listingSchema.safeParse({ ...valid, price_per_kg: 100_001 }).success).toBe(false)
  })
})
