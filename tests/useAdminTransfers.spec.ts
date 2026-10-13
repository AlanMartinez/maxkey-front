import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearNuxtState } from '#app'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ApiError } from '~/composables/useApi'
import { useAdminTransfers } from '~/composables/useAdminTransfers'
import { useToast } from '~/composables/useToast'
import type { AdminOrder } from '~/types/api'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)

function transfer(id: string): AdminOrder {
  return {
    id,
    buyerEmail: `${id}@example.com`,
    buyerPhone: '1123456789',
    paymentMethod: 'bank-transfer',
    status: 'AwaitingTransferValidation',
    paidAt: null,
    createdAt: '2026-10-13T12:00:00Z',
    totalAmount: 9990,
    currency: 'ARS',
    items: [{ itemId: `${id}-item`, variantId: 'v1', productName: 'Riot Points', variantName: '1.750 RP', quantity: 1, assigned: 0 }],
  }
}

async function loaded() {
  apiMock.mockResolvedValueOnce([transfer('order-a'), transfer('order-b')])
  const transfers = useAdminTransfers()
  await transfers.load()
  return transfers
}

beforeEach(() => {
  apiMock.mockReset()
  // Drops the shared `useState` toast list so each test starts with an empty stack.
  clearNuxtState()
})

describe('useAdminTransfers', () => {
  it('lists the orders awaiting transfer validation', async () => {
    const transfers = await loaded()

    expect(apiMock).toHaveBeenCalledWith('/admin/orders', { query: { status: 'awaiting-transfer' } })
    expect(transfers.status.value).toBe('success')
    expect(transfers.orders.value.map((o) => o.id)).toEqual(['order-a', 'order-b'])
  })

  it('approves: POSTs approve-transfer, removes the row and toasts success', async () => {
    const transfers = await loaded()
    apiMock.mockResolvedValueOnce({ ...transfer('order-a'), status: 'Paid' })

    const pending = transfers.approve('order-a')
    expect(transfers.deciding.value['order-a']).toBe('approve')
    await expect(pending).resolves.toBe(true)

    expect(apiMock).toHaveBeenLastCalledWith('/admin/orders/order-a/approve-transfer', { method: 'POST' })
    expect(transfers.orders.value.map((o) => o.id)).toEqual(['order-b'])
    expect(transfers.deciding.value['order-a']).toBeUndefined()
    expect(useToast().toasts.value).toEqual([expect.objectContaining({ tone: 'success' })])
  })

  it('rejects: POSTs reject-transfer and removes the row', async () => {
    const transfers = await loaded()
    apiMock.mockResolvedValueOnce({ ...transfer('order-b'), status: 'Cancelled' })

    await expect(transfers.reject('order-b')).resolves.toBe(true)

    expect(apiMock).toHaveBeenLastCalledWith('/admin/orders/order-b/reject-transfer', { method: 'POST' })
    expect(transfers.orders.value.map((o) => o.id)).toEqual(['order-a'])
  })

  it('keeps the row and toasts the error on 409', async () => {
    const transfers = await loaded()
    apiMock.mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Conflict', status: 409, detail: 'La orden ya no está esperando validación.' }))

    await expect(transfers.approve('order-a')).resolves.toBe(false)

    expect(transfers.orders.value.map((o) => o.id)).toEqual(['order-a', 'order-b'])
    expect(useToast().toasts.value).toEqual([expect.objectContaining({ tone: 'error', message: 'La orden ya no está esperando validación.' })])
  })

  it('surfaces a real backend error on load instead of painting mock data over it', async () => {
    apiMock.mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Server error', status: 500 }))
    const transfers = useAdminTransfers()
    await transfers.load()

    expect(transfers.status.value).toBe('error')
    expect(transfers.orders.value).toEqual([])
  })
})
