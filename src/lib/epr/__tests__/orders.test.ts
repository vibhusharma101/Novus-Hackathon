import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getOrderExpiry, isOrderExpired, canTransition, ORDER_TRANSITIONS } from '../orders'

describe('getOrderExpiry', () => {
  it('sets expiry 48 hours from creation time', () => {
    const createdAt = new Date('2026-06-08T10:00:00Z')
    const expiry = getOrderExpiry(createdAt)
    expect(expiry).toEqual(new Date('2026-06-10T10:00:00Z'))
  })
})

describe('isOrderExpired', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('not expired before 48h', () => {
    const expiry = new Date('2026-06-10T10:00:00Z')
    vi.setSystemTime(new Date('2026-06-10T09:59:59Z'))
    expect(isOrderExpired(expiry)).toBe(false)
  })

  it('expired at exactly 48h', () => {
    const expiry = new Date('2026-06-10T10:00:00Z')
    vi.setSystemTime(new Date('2026-06-10T10:00:00Z'))
    expect(isOrderExpired(expiry)).toBe(true)
  })

  it('expired after 48h', () => {
    const expiry = new Date('2026-06-10T10:00:00Z')
    vi.setSystemTime(new Date('2026-06-11T00:00:00Z'))
    expect(isOrderExpired(expiry)).toBe(true)
  })
})

describe('canTransition', () => {
  it('pending → transferred is valid', () => {
    expect(canTransition('pending', 'transferred')).toBe(true)
  })

  it('pending → declined is valid', () => {
    expect(canTransition('pending', 'declined')).toBe(true)
  })

  it('pending → expired is valid', () => {
    expect(canTransition('pending', 'expired')).toBe(true)
  })

  it('transferred → declined is invalid', () => {
    expect(canTransition('transferred', 'declined')).toBe(false)
  })

  it('declined → transferred is invalid', () => {
    expect(canTransition('declined', 'transferred')).toBe(false)
  })

  it('expired → transferred is invalid', () => {
    expect(canTransition('expired', 'transferred')).toBe(false)
  })
})

describe('ORDER_TRANSITIONS', () => {
  it('only pending has valid next states', () => {
    expect(ORDER_TRANSITIONS.pending).toEqual(['transferred', 'declined', 'expired'])
    expect(ORDER_TRANSITIONS.transferred).toEqual([])
    expect(ORDER_TRANSITIONS.declined).toEqual([])
    expect(ORDER_TRANSITIONS.expired).toEqual([])
  })
})
