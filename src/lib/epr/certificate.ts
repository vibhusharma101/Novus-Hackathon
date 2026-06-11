import { PlasticCategory } from './constants'

const CATEGORY_PREFIX: Record<PlasticCategory, string> = {
  rigid:    'RIG',
  flexible: 'FLX',
  mlp:      'MLP',
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomSuffix(length = 6): string {
  return Array.from({ length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

export function generateCertificateId(category: PlasticCategory, issuedAt: Date): string {
  const year = issuedAt.getFullYear()
  const prefix = CATEGORY_PREFIX[category]
  return `EPR-${year}-${prefix}-${randomSuffix()}`
}

/**
 * Deterministic reference ID for a provisional (not-yet-issued) certificate.
 * Derived from the order's UUID so the same order always renders the same ID
 * across reloads — unlike `generateCertificateId`, which is random.
 */
export function provisionalCertificateId(
  category: PlasticCategory,
  issuedAt: Date,
  seed: string,
): string {
  const year = issuedAt.getFullYear()
  const prefix = CATEGORY_PREFIX[category]
  const suffix = seed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6).padEnd(6, '0')
  return `EPR-${year}-${prefix}-${suffix}`
}

export function parseCertificateId(id: string): { year: number; category: PlasticCategory } | null {
  const match = id.match(/^EPR-(\d{4})-(RIG|FLX|MLP)-[A-Z0-9]{6}$/)
  if (!match) return null
  const prefixToCategory: Record<string, PlasticCategory> = { RIG: 'rigid', FLX: 'flexible', MLP: 'mlp' }
  return { year: parseInt(match[1]), category: prefixToCategory[match[2]] }
}
