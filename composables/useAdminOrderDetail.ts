import type { AdminBuyerOrder, AdminOrderDetail, AdminOrderEvent, AdminOrderKey } from '~/types/api'
import { ApiError } from '~/composables/useApi'

/**
 * Admin order detail for the OrderDetailDialog opened from the buyers table: full order data,
 * per-item assigned keys (ids + status only, never a code) and the outbox event history.
 *
 * Backed by "GET /admin/orders/{id}" (types/api.ts AdminOrderDetail). Until the maxkeys-back branch
 * is merged and deployed, dev builds synthesise a detail from the list row so the modal still works.
 */

// DEV-ONLY: derives a plausible detail from what the list row already knows. import.meta.dev is
// compile-time-false in production, so this is dead-code-eliminated from prod builds.
function mockDetail(order: AdminBuyerOrder, email: string): AdminOrderDetail {
  const paidAt = order.paidAt ?? null
  const paidMs = paidAt ? new Date(paidAt).getTime() : Date.now()
  const createdAt = new Date(paidMs - 15 * 60_000).toISOString()
  const delivered = order.status === 'Delivered'
  const deliveredAt = delivered ? new Date(paidMs + 2 * 60 * 60_000).toISOString() : null

  const items = order.items.map((item, i) => {
    const keys: AdminOrderKey[] = Array.from({ length: item.assignedKeys ?? 0 }, (_, k) => {
      const revealed = k < (item.revealedKeys ?? 0)
      return {
        keyId: `mock-key-${order.id}-${i}-${k}`,
        status: revealed ? 'Revealed' : 'Assigned',
        assignedAt: new Date(paidMs + 60_000).toISOString(),
        revealedAt: revealed ? new Date(paidMs + 3 * 60 * 60_000).toISOString() : null,
        revealedBy: revealed ? 'mock-supabase-user-id' : null,
      }
    })
    return {
      itemId: `${order.id}-item-${i}`,
      productName: item.productName,
      variantName: item.variantName,
      unitPrice: Math.round(order.totalAmount / Math.max(1, order.items.reduce((s, it) => s + (it.quantity ?? 0), 0))),
      quantity: item.quantity ?? 0,
      keys,
    }
  })

  const events: AdminOrderEvent[] = []
  if (paidAt) {
    events.push({ id: `${order.id}-ev-approved`, type: 'OrderApproved', status: 'Processed', createdAt: paidAt, processedAt: new Date(paidMs + 30_000).toISOString(), attempts: 1, lastError: null })
  }
  if (delivered && deliveredAt) {
    events.push({ id: `${order.id}-ev-delivered`, type: 'OrderDelivered', status: 'Processed', createdAt: deliveredAt, processedAt: new Date(new Date(deliveredAt).getTime() + 20_000).toISOString(), attempts: 1, lastError: null })
  }
  if (order.status === 'AwaitingFulfillment' && items.some((it) => it.keys.length < it.quantity)) {
    events.push({ id: `${order.id}-ev-failed`, type: 'OrderApproved', status: 'Failed', createdAt: new Date(paidMs + 40_000).toISOString(), processedAt: null, attempts: 3, lastError: 'Insufficient stock for one or more items', })
  }

  return {
    id: order.id,
    buyerEmail: email,
    status: order.status,
    totalAmount: order.totalAmount,
    currency: order.currency,
    createdAt,
    paidAt,
    deliveredAt,
    updatedAt: deliveredAt ?? paidAt ?? createdAt,
    mpPaymentId: paidAt ? `mp-${order.id.slice(-8)}` : null,
    lastPaymentAttemptStatus: paidAt ? 'approved' : order.status === 'Pending' ? 'pending' : null,
    lastPaymentAttemptAt: paidAt,
    items,
    events: events.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }
}

export function useAdminOrderDetail() {
  const api = useApi()

  const detail = ref<AdminOrderDetail | null>(null)
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const error = ref<ApiError | null>(null)

  // `fallback` is the list row the modal was opened from — only used to build the dev mock.
  async function load(orderId: string, fallback?: { order: AdminBuyerOrder; email: string }) {
    status.value = 'pending'
    error.value = null
    detail.value = null
    try {
      try {
        detail.value = await api<AdminOrderDetail>(`/admin/orders/${orderId}`)
      } catch (e) {
        if (!import.meta.dev || !fallback) throw e
        console.warn('[useAdminOrderDetail] GET /admin/orders/{id} unavailable, using dev mock detail:', e)
        detail.value = mockDetail(fallback.order, fallback.email)
      }
      status.value = 'success'
    } catch (e) {
      error.value = e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
      status.value = 'error'
    }
  }

  function reset() {
    detail.value = null
    status.value = 'idle'
    error.value = null
  }

  return { detail, status, error, load, reset }
}
