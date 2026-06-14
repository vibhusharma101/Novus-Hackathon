import { calculatePricing, PricingResult } from './pricing'

export interface MatchInput {
  deficitKg: number
  listingQty: number
  pricePerKg: number
}

export interface MatchResult extends PricingResult {
  orderQty: number
  residualDeficit: number
}

export function matchOrder({ deficitKg, listingQty, pricePerKg }: MatchInput): MatchResult {
  const orderQty = Math.min(deficitKg, listingQty)
  const residualDeficit = Math.max(0, deficitKg - orderQty)
  const pricing = calculatePricing(orderQty, pricePerKg)
  return { orderQty, residualDeficit, ...pricing }
}
