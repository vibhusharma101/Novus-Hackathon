import { ORDER_EXPIRY_HOURS } from './constants'

export type OrderStatus = 'pending' | 'transferred' | 'declined' | 'expired'

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:     ['transferred', 'declined', 'expired'],
  transferred: [],
  declined:    [],
  expired:     [],
}

export function getOrderExpiry(createdAt: Date): Date {
  return new Date(createdAt.getTime() + ORDER_EXPIRY_HOURS * 60 * 60 * 1000)
}

export function isOrderExpired(expiresAt: Date): boolean {
  return Date.now() >= expiresAt.getTime()
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to)
}
