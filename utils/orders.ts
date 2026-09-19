import type { OrderItemDto, OrderStatus } from '~/types/api'

/**
 * key-delivery-gate (PR #49): whether the "Revelar key" action should show for this item. Driven by the
 * API's own `revealable` flag, not a client-side order-status check — the server is the source of truth
 * for when reveal is allowed. Once an item has revealed codes, the action never shows again.
 */
export function canRevealKeys(item: Pick<OrderItemDto, 'revealable' | 'keys'>): boolean {
  return item.revealable && item.keys.length === 0
}

export type BuyerOrderAction = 'assign' | 'deliver' | 'resend'

/**
 * Admin buyers table: each order status maps to exactly one primary action, so a row never shows two
 * competing buttons and the Acciones filter in pages/admin/buyers.vue stays in sync with
 * BuyerOrderRow.vue.
 *   Paid / AwaitingFulfillment → assign   (retry auto-assignment; also re-runs after a no-stock partial)
 *   KeysAssigned               → deliver  (the only action that asks for confirmation)
 *   Delivered                  → resend
 *   Pending / Cancelled        → none
 */
export function buyerOrderAction(status: OrderStatus): BuyerOrderAction | null {
  if (status === 'Paid' || status === 'AwaitingFulfillment') return 'assign'
  if (status === 'KeysAssigned') return 'deliver'
  if (status === 'Delivered') return 'resend'
  return null
}
