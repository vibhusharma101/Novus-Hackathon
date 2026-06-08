import { PLATFORM_FEE_PCT } from './constants'

export interface PricingResult {
  creditsCost: number
  platformFee: number
  total: number
}

export function calculatePricing(qtyKg: number, pricePerKg: number): PricingResult {
  const creditsCost = Math.round(qtyKg * pricePerKg)
  const platformFee = Math.round(creditsCost * PLATFORM_FEE_PCT)
  return { creditsCost, platformFee, total: creditsCost + platformFee }
}
