import type { OrderDetailDto, OrderItemDto } from '~/types/api'

/**
 * orders-history spec "Order Detail With Conditional Key Reveal" / "Non-delivered order hides keys":
 * key codes for an item are visible only once the whole order is `Delivered`, regardless of
 * per-item fulfillment progress. Never return codes for a non-delivered order even if present in the payload.
 */
export function visibleKeys(order: Pick<OrderDetailDto, 'status'>, item: Pick<OrderItemDto, 'keys'>): string[] {
  return order.status === 'Delivered' ? (item.keys ?? []) : []
}
