import { PlasticCategory, TARGET_PCT, COST_RANGE } from './constants'

export function calculateLiability(category: PlasticCategory, marketKg: number): number {
  return Math.round(marketKg * TARGET_PCT[category])
}

export function calculateDeficit(liabilityKg: number, securedKg: number): number {
  return Math.max(0, liabilityKg - securedKg)
}

export function estimateCostRange(category: PlasticCategory, deficitKg: number) {
  const { min, max } = COST_RANGE[category]
  return { min: deficitKg * min, max: deficitKg * max }
}
