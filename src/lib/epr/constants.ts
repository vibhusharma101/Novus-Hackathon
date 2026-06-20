export const PLASTIC_CATEGORIES = ['rigid', 'flexible', 'mlp'] as const
export type PlasticCategory = typeof PLASTIC_CATEGORIES[number]

export const PLASTIC_SUBCATEGORIES = ['recycling', 'end_of_life'] as const
export type PlasticSubcategory = typeof PLASTIC_SUBCATEGORIES[number]

export const SUBCATEGORY_LABELS: Record<PlasticSubcategory, string> = {
  recycling: 'Recycling',
  end_of_life: 'End of Life',
}

export const TARGET_PCT: Record<PlasticCategory, number> = {
  rigid: 0.30,
  flexible: 0.20,
  mlp: 0.15,
}

export const COST_RANGE: Record<PlasticCategory, { min: number; max: number }> = {
  rigid:    { min: 12, max: 14 },
  flexible: { min: 14, max: 17 },
  mlp:      { min: 16, max: 20 },
}

export const PLATFORM_FEE_PCT = 0.05
export const ORDER_EXPIRY_HOURS = 48
export const MAX_PENALTY_FIXED = 1_500_000
export const MAX_PENALTY_DAILY = 10_000
