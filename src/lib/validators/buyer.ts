import { z } from 'zod'

// GSTIN: 2-digit state code + 5-letter PAN + 4 digits + 1 letter + 1 entity char + 'Z' + 1 checksum
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
export const GSTIN_EXAMPLE = '27AABCU9603R1ZX'

// Indian mobile: 10 digits starting 6–9 (the +91 prefix is shown separately in the UI)
export const PHONE_REGEX = /^[6-9][0-9]{9}$/

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Chandigarh', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry',
] as const

export const buyerProfileSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, 'Enter your legal business name')
    .max(200, 'Name is too long'),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(GSTIN_REGEX, `Invalid GSTIN. Expected format: ${GSTIN_EXAMPLE}`),
  contact_name: z
    .string()
    .trim()
    .min(2, 'Enter the contact person’s name')
    .max(120, 'Name is too long'),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Enter a valid 10-digit mobile number'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .max(254, 'Email is too long'),
  state: z
    .string()
    .min(1, 'Select your registration state'),
})

export type BuyerProfileInput = z.infer<typeof buyerProfileSchema>
