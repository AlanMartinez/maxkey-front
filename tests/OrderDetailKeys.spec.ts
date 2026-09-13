import { describe, expect, it } from 'vitest'
import type { OrderItemDto } from '~/types/api'
import { visibleKeys } from '~/utils/orders'

const item: OrderItemDto = { productName: 'Riot Points', variantName: '1.750 RP', unitPrice: 9990, quantity: 1, keys: ['ABCD-1234'] }

describe('visibleKeys', () => {
  it('hides keys regardless of per-item progress unless the order is Delivered (orders-history: Non-delivered order hides keys)', () => {
    expect(visibleKeys({ status: 'AwaitingFulfillment' }, item)).toEqual([])
    expect(visibleKeys({ status: 'Pending' }, item)).toEqual([])
    expect(visibleKeys({ status: 'Cancelled' }, item)).toEqual([])
  })

  it('reveals the item keys once the order is Delivered', () => {
    expect(visibleKeys({ status: 'Delivered' }, item)).toEqual(['ABCD-1234'])
  })

  it('returns an empty array when a delivered item has no keys yet', () => {
    expect(visibleKeys({ status: 'Delivered' }, { ...item, keys: undefined })).toEqual([])
  })
})
