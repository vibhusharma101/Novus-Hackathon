import { z } from 'zod'

// Stored in kg (canonical). The form collects MT and converts (×1000) before
// calling the action. Bounds mirror the S3 design guidance: 5 MT – 500 MT.
export const LISTING_MIN_KG = 5_000
export const LISTING_MAX_KG = 500_000
export const LISTING_MAX_PRICE = 100_000

export const listingSchema = z.object({
  category: z.enum(['rigid', 'flexible', 'mlp']),
  subcategory: z.enum(['recycling', 'end_of_life']).optional(),
  qty_kg: z
    .number()
    .positive('Enter a quantity greater than 0')
    .min(LISTING_MIN_KG, 'Minimum listing is 5 MT')
    .max(LISTING_MAX_KG, 'Maximum listing is 500 MT'),
  price_per_kg: z
    .number()
    .positive('Enter a price greater than 0')
    .max(LISTING_MAX_PRICE, 'Price is unrealistically high'),
  credit_type: z.enum(['recycling', 'eol']).default('recycling'),
})

export type ListingInput = z.infer<typeof listingSchema>
