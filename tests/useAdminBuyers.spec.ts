import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ApiError } from '~/composables/useApi'
import { useAdminBuyers } from '~/composables/useAdminBuyers'
import type { AdminBuyersPage } from '~/types/api'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)

const page: AdminBuyersPage = {
  items: [
    {
      email: 'buyer@example.com',
      orderCount: 1,
      lastPaidAt: '2026-01-01T00:00:00Z',
      orders: [
        {
          id: 'order-1',
          status: 'Delivered',
          paidAt: '2026-01-01T00:00:00Z',
          totalAmount: 9990,
          currency: 'ARS',
          items: [{ productName: 'Riot Points', variantName: '1.750 RP', quantity: 1, assignedKeys: 1 }],
        },
      ],
    },
  ],
  page: 1,
  pageSize: 20,
  total: 1,
}

beforeEach(() => {
  apiMock.mockReset()
})

describe('useAdminBuyers', () => {
  it('loads the first page and exposes pagination metadata', async () => {
    apiMock.mockResolvedValue(page)
    const buyers = useAdminBuyers()

    await buyers.load()

    expect(apiMock).toHaveBeenCalledWith('/admin/buyers', { query: { email: undefined, page: 1, pageSize: 20 } })
    expect(buyers.buyers.value).toEqual(page.items)
    expect(buyers.total.value).toBe(1)
    expect(buyers.status.value).toBe('success')
  })

  it('search resets to page 1 and sends the email filter', async () => {
    apiMock.mockResolvedValue({ ...page, items: [], total: 0 })
    const buyers = useAdminBuyers()
    buyers.page.value = 3

    await buyers.search('buyer@')

    expect(apiMock).toHaveBeenCalledWith('/admin/buyers', { query: { email: 'buyer@', page: 1, pageSize: 20 } })
    expect(buyers.page.value).toBe(1)
  })

  it('resend succeeds and tracks per-order state', async () => {
    apiMock.mockResolvedValueOnce(page).mockResolvedValueOnce({ outboxEventId: 'evt-1' })
    const buyers = useAdminBuyers()
    await buyers.load()

    const result = await buyers.resendDelivery('order-1')

    expect(apiMock).toHaveBeenCalledWith('/admin/orders/order-1/resend-delivery', { method: 'POST' })
    expect(result).toBe(true)
    expect(buyers.resendSuccess.value['order-1']).toBe(true)
    expect(buyers.resending.value['order-1']).toBe(false)
    expect(buyers.resendError.value['order-1']).toBeNull()
  })

  it('resend 409 surfaces a readable error and does not mark success', async () => {
    apiMock.mockResolvedValueOnce(page).mockRejectedValueOnce(
      new ApiError({ type: 'about:blank', title: 'Conflict', status: 409, detail: 'Cannot resend the delivery email unless the order is Delivered.' }),
    )
    const buyers = useAdminBuyers()
    await buyers.load()

    const result = await buyers.resendDelivery('order-1')

    expect(result).toBe(false)
    expect(buyers.resendSuccess.value['order-1']).toBe(false)
    expect(buyers.resendError.value['order-1']).toBeInstanceOf(ApiError)
    expect(buyers.resendError.value['order-1']?.status).toBe(409)
    expect(buyers.resendError.value['order-1']?.detail).toBe('Cannot resend the delivery email unless the order is Delivered.')
  })
})
