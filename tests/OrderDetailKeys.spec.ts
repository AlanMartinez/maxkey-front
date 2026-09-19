import { describe, expect, it } from 'vitest'
import type { OrderItemDto } from '~/types/api'
import { canRevealKeys } from '~/utils/orders'

const baseItem: OrderItemDto = {
  itemId: 'item-1',
  productName: 'Riot Points',
  variantName: '1.750 RP',
  unitPrice: 9990,
  quantity: 1,
  keys: [],
  revealable: false,
}

describe('canRevealKeys', () => {
  it('hides the reveal action when the server says the item is not revealable (key-delivery-gate: server-driven gate, not order.status)', () => {
    expect(canRevealKeys({ ...baseItem, revealable: false, keys: [] })).toBe(false)
  })

  it('shows the reveal action when revealable and nothing has been revealed yet', () => {
    expect(canRevealKeys({ ...baseItem, revealable: true, keys: [] })).toBe(true)
  })

  it('hides the reveal action once keys have already been revealed, even if still revealable', () => {
    expect(canRevealKeys({ ...baseItem, revealable: true, keys: ['ABCD-1234'] })).toBe(false)
  })
})
