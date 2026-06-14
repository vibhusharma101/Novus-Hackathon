import { z } from 'zod'
import { INDIAN_STATES, PHONE_REGEX } from './buyer'

export { INDIAN_STATES }

// CPCB PWP registration: permissive — alphanumerics plus - and /, e.g. B-29016/PWP/2023
export const CPCB_REG_REGEX = /^[A-Z0-9][A-Z0-9\-/]{3,58}[A-Z0-9]$/
export const CPCB_REG_EXAMPLE = 'B-29016/PWP/2023'

export const sellerProfileSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, 'Enter your legal business name')
    .max(200, 'Name is too long'),
  cpcb_reg_no: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CPCB_REG_REGEX, `Invalid registration number. Example: ${CPCB_REG_EXAMPLE}`),
  state: z
    .string()
    .min(1, 'Select your operating state'),
  // Registered with { valueAsNumber: true } in the form, so an empty/non-numeric
  // field arrives as NaN and fails .positive() with a clear message.
  capacity_mt: z
    .number()
    .positive('Enter a capacity greater than 0')
    .max(10_000_000, 'Capacity is unrealistically high'),
  contact_name: z
    .string()
    .trim()
    .min(2, 'Enter the contact person’s name')
    .max(120, 'Name is too long'),
  whatsapp: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Enter a valid 10-digit WhatsApp number'),
})

export type SellerProfileInput = z.infer<typeof sellerProfileSchema>
