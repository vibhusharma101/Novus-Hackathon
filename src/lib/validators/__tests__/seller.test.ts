import { describe, it, expect } from 'vitest'
import { sellerProfileSchema, CPCB_REG_EXAMPLE } from '../seller'

const valid = {
  company_name: 'Green Circle Solutions',
  cpcb_reg_no: CPCB_REG_EXAMPLE,
  state: 'Maharashtra',
  capacity_mt: 15000,
  contact_name: 'Asha Rao',
  whatsapp: '9876543210',
}

describe('sellerProfileSchema', () => {
  it('accepts a well-formed seller profile', () => {
    const r = sellerProfileSchema.safeParse(valid)
    expect(r.success).toBe(true)
  })

  it('uppercases the CPCB registration number', () => {
    const r = sellerProfileSchema.safeParse({ ...valid, cpcb_reg_no: 'b-29016/pwp/2023' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.cpcb_reg_no).toBe('B-29016/PWP/2023')
  })

  it('rejects a too-short registration number', () => {
    const r = sellerProfileSchema.safeParse({ ...valid, cpcb_reg_no: 'AB' })
    expect(r.success).toBe(false)
  })

  it('rejects a registration number containing a space', () => {
    const r = sellerProfileSchema.safeParse({ ...valid, cpcb_reg_no: 'B 29016 PWP' })
    expect(r.success).toBe(false)
  })

  it('rejects non-positive capacity', () => {
    expect(sellerProfileSchema.safeParse({ ...valid, capacity_mt: 0 }).success).toBe(false)
    expect(sellerProfileSchema.safeParse({ ...valid, capacity_mt: -5 }).success).toBe(false)
  })

  it('rejects NaN capacity (empty number field)', () => {
    const r = sellerProfileSchema.safeParse({ ...valid, capacity_mt: NaN })
    expect(r.success).toBe(false)
  })

  it('rejects an invalid WhatsApp number', () => {
    expect(sellerProfileSchema.safeParse({ ...valid, whatsapp: '12345' }).success).toBe(false)
    expect(sellerProfileSchema.safeParse({ ...valid, whatsapp: '5876543210' }).success).toBe(false)
  })

  it('requires a state selection', () => {
    const r = sellerProfileSchema.safeParse({ ...valid, state: '' })
    expect(r.success).toBe(false)
  })
})
