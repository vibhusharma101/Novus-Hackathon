import { describe, it, expect } from 'vitest'
import { generateCertificateId, parseCertificateId } from '../certificate'
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

describe('parseCertificateId', () => {
  it('extracts year and category from a valid ID', () => {
    const parsed = parseCertificateId('EPR-2026-RIG-A3X9K2')
    expect(parsed).toEqual({ year: 2026, category: 'rigid' as PlasticCategory })
  })

  it('returns null for an invalid ID', () => {
    expect(parseCertificateId('INVALID')).toBeNull()
  })
})
