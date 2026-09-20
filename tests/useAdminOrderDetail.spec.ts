import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearNuxtState } from '#app'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ApiError } from '~/composables/useApi'
import { useAdminOrderDetail } from '~/composables/useAdminOrderDetail'
import { useToast } from '~/composables/useToast'
import type { AdminOrderDetail, AttachKeyResponse } from '~/types/api'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)

function detailWith(keys: number): AdminOrderDetail {
  return {
    id: 'order-1',
    buyerEmail: 'buyer@example.com',
    status: keys >= 2 ? 'KeysAssigned' : 'AwaitingFulfillment',
    totalAmount: 9990,
    currency: 'ARS',
    createdAt: '2026-01-01T00:00:00Z',
    paidAt: '2026-01-01T00:05:00Z',
    deliveredAt: null,
    updatedAt: '2026-01-01T00:05:00Z',
    mpPaymentId: 'mp-1',
    lastPaymentAttemptStatus: 'approved',
    lastPaymentAttemptAt: '2026-01-01T00:05:00Z',
    items: [
      {
        itemId: 'item-1',
        productName: 'Riot Points',
        variantName: '1.750 RP',
        unitPrice: 4995,
        quantity: 2,
        keys: Array.from({ length: keys }, (_, k) => ({ keyId: `key-${k}`, status: 'Assigned' as const, assignedAt: '2026-01-01T00:06:00Z', revealedAt: null, revealedBy: null })),
      },
    ],
    events: [],
  }
}

const attachResponse: AttachKeyResponse = { orderStatus: 'KeysAssigned', items: [{ itemId: 'item-1', quantity: 2, assigned: 2 }] }

beforeEach(() => {
  apiMock.mockReset()
  // Drops the shared `useState` toast list so each test starts with an empty stack.
  clearNuxtState()
})

describe('useAdminOrderDetail.attachKey', () => {
  it('POSTs the trimmed code, toasts success, refetches the detail in place and returns the response', async () => {
    apiMock.mockResolvedValueOnce(detailWith(1)).mockResolvedValueOnce(attachResponse).mockResolvedValueOnce(detailWith(2))
    const orderDetail = useAdminOrderDetail()
    await orderDetail.load('order-1')

    const pending = orderDetail.attachKey('order-1', 'item-1', '  ABCD-1234  ')
    // The previous detail stays on screen while the refresh is in flight (no skeleton flash).
    expect(orderDetail.attaching.value['item-1']).toBe(true)
    expect(orderDetail.status.value).toBe('success')
    expect(orderDetail.detail.value?.items[0]?.keys).toHaveLength(1)
    const result = await pending

    expect(apiMock).toHaveBeenCalledWith('/admin/orders/order-1/items/item-1/keys', { method: 'POST', body: { code: 'ABCD-1234' } })
    expect(apiMock).toHaveBeenLastCalledWith('/admin/orders/order-1')
    expect(result).toEqual(attachResponse)
    expect(orderDetail.detail.value?.items[0]?.keys).toHaveLength(2)
    expect(orderDetail.attaching.value['item-1']).toBe(false)
    expect(useToast().toasts.value).toEqual([expect.objectContaining({ tone: 'success', message: 'Key cargada.' })])
  })

  it('warns and skips the request when the code is blank', async () => {
    apiMock.mockResolvedValueOnce(detailWith(1))
    const orderDetail = useAdminOrderDetail()
    await orderDetail.load('order-1')
    apiMock.mockClear()

    const result = await orderDetail.attachKey('order-1', 'item-1', '   ')

    expect(result).toBeNull()
    expect(apiMock).not.toHaveBeenCalled()
    expect(useToast().toasts.value).toEqual([expect.objectContaining({ tone: 'warning', message: 'Pegá un código de key.' })])
  })

  it('surfaces a 409 as an error toast, keeps the current detail and returns null', async () => {
    apiMock
      .mockResolvedValueOnce(detailWith(1))
      .mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Conflict', status: 409, detail: 'Item already has all its keys.' }))
    const orderDetail = useAdminOrderDetail()
    await orderDetail.load('order-1')

    const result = await orderDetail.attachKey('order-1', 'item-1', 'ABCD-1234')

    expect(result).toBeNull()
    expect(apiMock).toHaveBeenCalledTimes(2)
    expect(orderDetail.detail.value?.items[0]?.keys).toHaveLength(1)
    expect(orderDetail.attaching.value['item-1']).toBe(false)
    expect(useToast().toasts.value).toEqual([expect.objectContaining({ tone: 'error', message: 'Item already has all its keys.' })])
  })
})
