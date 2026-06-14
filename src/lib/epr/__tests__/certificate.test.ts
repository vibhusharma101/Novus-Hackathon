import { describe, it, expect } from 'vitest'
import { generateCertificateId, parseCertificateId, provisionalCertificateId } from '../certificate'
import type { PlasticCategory } from '../constants'

describe('generateCertificateId', () => {
  it('follows format EPR-YYYY-CAT-XXXXXX', () => {
    const id = generateCertificateId('rigid', new Date('2026-06-08'))
    expect(id).toMatch(/^EPR-2026-RIG-[A-Z0-9]{6}$/)
  })

  it('uses correct prefix for each category', () => {
    expect(generateCertificateId('rigid',    new Date('2026-01-01'))).toMatch(/^EPR-2026-RIG-/)
    expect(generateCertificateId('flexible', new Date('2026-01-01'))).toMatch(/^EPR-2026-FLX-/)
    expect(generateCertificateId('mlp',      new Date('2026-01-01'))).toMatch(/^EPR-2026-MLP-/)
  })

  it('generates unique IDs on repeated calls', () => {
    const ids = Array.from({ length: 100 }, () => generateCertificateId('rigid', new Date()))
    const unique = new Set(ids)
    expect(unique.size).toBe(100)
  })
})

describe('provisionalCertificateId', () => {
  const order = '550e8400-e29b-41d4-a716-446655440000'

  it('follows format EPR-YYYY-CAT-XXXXXX', () => {
    const id = provisionalCertificateId('rigid', new Date('2026-06-08'), order)
    expect(id).toMatch(/^EPR-2026-RIG-[A-Z0-9]{6}$/)
  })

  it('is deterministic for the same seed', () => {
    const a = provisionalCertificateId('mlp', new Date('2026-01-01'), order)
    const b = provisionalCertificateId('mlp', new Date('2026-01-01'), order)
    expect(a).toBe(b)
  })

  it('derives the suffix from the seed UUID', () => {
    const id = provisionalCertificateId('flexible', new Date('2026-01-01'), order)
    // first 6 alphanumerics of the UUID, uppercased: "550e84" -> "550E84"
    expect(id).toBe('EPR-2026-FLX-550E84')
  })

  it('round-trips through parseCertificateId', () => {
    const id = provisionalCertificateId('rigid', new Date('2026-06-08'), order)
    expect(parseCertificateId(id)).toEqual({ year: 2026, category: 'rigid' as PlasticCategory })
  })

  it('pads short seeds to a 6-char suffix', () => {
    const id = provisionalCertificateId('rigid', new Date('2026-01-01'), 'ab')
    expect(id).toMatch(/^EPR-2026-RIG-[A-Z0-9]{6}$/)
    expect(id).toBe('EPR-2026-RIG-AB0000')
  })
})

describe('parseCertificateId', () => {
  it('extracts year and category from a valid ID', () => {
    const parsed = parseCertificateId('EPR-2026-RIG-A3X9K2')
    expect(parsed).toEqual({ year: 2026, category: 'rigid' as PlasticCategory })
  })

  it('returns null for an invalid ID', () => {
    expect(parseCertificateId('INVALID')).toBeNull()
  })
})
