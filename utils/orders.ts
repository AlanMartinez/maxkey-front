import type { OrderItemDto } from '~/types/api'

/**
 * key-delivery-gate (PR #49): whether the "Revelar key" action should show for this item. Driven by the
 * API's own `revealable` flag, not a client-side order-status check — the server is the source of truth
 * for when reveal is allowed. Once an item has revealed codes, the action never shows again.
 */
export function canRevealKeys(item: Pick<OrderItemDto, 'revealable' | 'keys'>): boolean {
  return item.revealable && item.keys.length === 0
}
