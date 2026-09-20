import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearNuxtState } from '#app'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ApiError } from '~/composables/useApi'
import { useAdminBuyers } from '~/composables/useAdminBuyers'
import { useToast } from '~/composables/useToast'
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
          items: [{ productName: 'Riot Points', variantName: '1.750 RP', quantity: 1, assignedKeys: 1, revealedKeys: 0 }],
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
  // Drops the shared `useState` toast list so each test starts with an empty stack.
  clearNuxtState()
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
    expect(useToast().toasts.value).toEqual([expect.objectContaining({ tone: 'error', message: 'Cannot resend the delivery email unless the order is Delivered.' })])
  })

  it('assignKeys succeeds and patches the order status in local state (key-delivery-gate PR #49)', async () => {
    const awaitingPage: AdminBuyersPage = { ...page, items: [{ ...page.items[0]!, orders: [{ ...page.items[0]!.orders[0]!, status: 'AwaitingFulfillment' }] }] }
    apiMock.mockResolvedValueOnce(awaitingPage).mockResolvedValueOnce({ orderStatus: 'KeysAssigned', allItemsComplete: true, items: [] })
    const buyers = useAdminBuyers()
    await buyers.load()

    const result = await buyers.assignKeys('order-1')

    expect(apiMock).toHaveBeenCalledWith('/admin/orders/order-1/assign-keys', { method: 'POST' })
    expect(result).toBe(true)
    expect(buyers.assignSuccess.value['order-1']).toBe(true)
    expect(buyers.assigning.value['order-1']).toBe(false)
    expect(buyers.buyers.value[0]!.orders[0]!.status).toBe('KeysAssigned')
    expect(useToast().toasts.value).toHaveLength(0)
  })

  it('applyAssignResult patches status and per-item counts by index, status only when the item counts disagree', async () => {
    const awaitingPage: AdminBuyersPage = { ...page, items: [{ ...page.items[0]!, orders: [{ ...page.items[0]!.orders[0]!, status: 'AwaitingFulfillment', items: [{ productName: 'Riot Points', variantName: '1.750 RP', quantity: 2, assignedKeys: 0, revealedKeys: 0 }] }] }] }
    apiMock.mockResolvedValueOnce(awaitingPage)
    const buyers = useAdminBuyers()
    await buyers.load()

    buyers.applyAssignResult('order-1', { orderStatus: 'AwaitingFulfillment', items: [{ quantity: 2, assigned: 1 }] })
    expect(buyers.buyers.value[0]!.orders[0]!.status).toBe('AwaitingFulfillment')
    expect(buyers.buyers.value[0]!.orders[0]!.items[0]!.assignedKeys).toBe(1)

    // Length mismatch: the index correlation can't be trusted, so counts are left alone.
    buyers.applyAssignResult('order-1', { orderStatus: 'KeysAssigned', items: [] })
    expect(buyers.buyers.value[0]!.orders[0]!.status).toBe('KeysAssigned')
    expect(buyers.buyers.value[0]!.orders[0]!.items[0]!.assignedKeys).toBe(1)
  })

  it('assignKeys with allItemsComplete: false does not mark success (stock ran out again)', async () => {
    const awaitingPage: AdminBuyersPage = { ...page, items: [{ ...page.items[0]!, orders: [{ ...page.items[0]!.orders[0]!, status: 'AwaitingFulfillment' }] }] }
    apiMock.mockResolvedValueOnce(awaitingPage).mockResolvedValueOnce({
      orderStatus: 'AwaitingFulfillment',
      allItemsComplete: false,
      items: [{ itemId: 'item-1', quantity: 3, assignedKeys: 1 }],
    })
    const buyers = useAdminBuyers()
    await buyers.load()

    const result = await buyers.assignKeys('order-1')

    expect(result).toBe(true)
    expect(buyers.assignSuccess.value['order-1']).toBeFalsy()
    expect(buyers.assignIncomplete.value['order-1']).toBe('Sin stock suficiente: 1 de 3 clave(s) asignada(s).')
    // Surfaced as a floating warning toast rather than inline in the table row.
    expect(useToast().toasts.value).toEqual([expect.objectContaining({ tone: 'warning', message: 'Sin stock suficiente: 1 de 3 clave(s) asignada(s).' })])
    // status stays whatever the server reports — still AwaitingFulfillment, not silently advanced
    expect(buyers.buyers.value[0]!.orders[0]!.status).toBe('AwaitingFulfillment')
  })

  it('deliverOrder succeeds and patches the order status in local state', async () => {
    const assignedPage: AdminBuyersPage = { ...page, items: [{ ...page.items[0]!, orders: [{ ...page.items[0]!.orders[0]!, status: 'KeysAssigned' }] }] }
    apiMock.mockResolvedValueOnce(assignedPage).mockResolvedValueOnce({ status: 'Delivered' })
    const buyers = useAdminBuyers()
    await buyers.load()

    const result = await buyers.deliverOrder('order-1')

    expect(apiMock).toHaveBeenCalledWith('/admin/orders/order-1/deliver', { method: 'POST' })
    expect(result).toBe(true)
    expect(buyers.deliverSuccess.value['order-1']).toBe(true)
    expect(buyers.buyers.value[0]!.orders[0]!.status).toBe('Delivered')
  })

  it('deliverOrder 409 (not all keys assigned yet) surfaces a readable error, not treated as unexpected', async () => {
    const assignedPage: AdminBuyersPage = { ...page, items: [{ ...page.items[0]!, orders: [{ ...page.items[0]!.orders[0]!, status: 'KeysAssigned' }] }] }
    apiMock.mockResolvedValueOnce(assignedPage).mockRejectedValueOnce(
      new ApiError({ type: 'about:blank', title: 'Conflict', status: 409, detail: 'No todas las keys están asignadas todavía.' }),
    )
    const buyers = useAdminBuyers()
    await buyers.load()

    const result = await buyers.deliverOrder('order-1')

    expect(result).toBe(false)
    expect(buyers.deliverSuccess.value['order-1']).toBe(false)
    expect(buyers.deliverError.value['order-1']).toBeInstanceOf(ApiError)
    expect(buyers.deliverError.value['order-1']?.status).toBe(409)
    // status stays whatever it was — a 409 means nothing changed server-side
    expect(buyers.buyers.value[0]!.orders[0]!.status).toBe('KeysAssigned')
    expect(useToast().toasts.value).toEqual([expect.objectContaining({ tone: 'error', message: 'No todas las keys están asignadas todavía.' })])
  })

  it('assignKeys failure surfaces an error toast with the friendly message', async () => {
    apiMock.mockResolvedValueOnce(page).mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Forbidden', status: 403 }))
    const buyers = useAdminBuyers()
    await buyers.load()

    const result = await buyers.assignKeys('order-1')

    expect(result).toBe(false)
    expect(buyers.assignError.value['order-1']?.status).toBe(403)
    expect(useToast().toasts.value).toEqual([expect.objectContaining({ tone: 'error', message: 'No tenés permisos para esta acción.' })])
  })
})
