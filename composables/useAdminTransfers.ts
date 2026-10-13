import type { AdminOrder } from '~/types/api'
import { ApiError, isBackendUnreachable } from '~/composables/useApi'

/**
 * Bank-transfer validation queue for admins: orders whose buyer reported a transfer
 * (`GET /admin/orders?status=awaiting-transfer`), approved (→ Paid, then the usual auto-delivery /
 * fulfillment) or rejected (→ Cancelled) one by one. Either action takes the order out of the queue, so
 * the row is removed locally on success instead of refetching the list.
 */

export type TransferDecision = 'approve' | 'reject'

// DEV-ONLY fixture, same technique as mockBuyers in useAdminBuyers.ts: import.meta.dev is
// compile-time-false in production, so the fallback branch that calls this is dead-code-eliminated in
// prod builds and the fixture can never be served there.
function mockTransfers(): AdminOrder[] {
  const mockMinute = 60_000
  const mockNow = Date.now()
  return [
    {
      // Single item, phone typed with separators the way buyers enter it.
      id: 'mock-transfer-01', buyerEmail: 'transfer1@example.com', buyerPhone: '+54 9 11 2345-6789', paymentMethod: 'bank-transfer',
      status: 'AwaitingTransferValidation', paidAt: null, createdAt: new Date(mockNow - 12 * mockMinute).toISOString(), totalAmount: 9990, currency: 'ARS',
      items: [{ itemId: 'mock-transfer-01-item-0', variantId: 'mock-variant-rp', productName: 'Riot Points', variantName: '1.750 RP', quantity: 1, assigned: 0 }],
    },
    {
      // Multiple items and quantities — exercises the items column summary.
      id: 'mock-transfer-02', buyerEmail: 'transfer2@example.com', buyerPhone: '1155550000', paymentMethod: 'bank-transfer',
      status: 'AwaitingTransferValidation', paidAt: null, createdAt: new Date(mockNow - 3 * 60 * mockMinute).toISOString(), totalAmount: 32970, currency: 'ARS',
      items: [
        { itemId: 'mock-transfer-02-item-0', variantId: 'mock-variant-robux', productName: 'Robux', variantName: '800 R$', quantity: 2, assigned: 0 },
        { itemId: 'mock-transfer-02-item-1', variantId: 'mock-variant-steam', productName: 'Steam Wallet Gift Card', variantName: 'AR', quantity: 1, assigned: 0 },
      ],
    },
  ]
}

export function useAdminTransfers() {
  const api = useApi()
  const toast = useToast()

  const orders = ref<AdminOrder[]>([])
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const error = ref<ApiError | null>(null)
  // In-flight decision per order id, so each row's buttons spin independently.
  const deciding = ref<Record<string, TransferDecision | undefined>>({})

  function toApiError(e: unknown) {
    return e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
  }

  async function load() {
    status.value = 'pending'
    error.value = null
    try {
      let result: AdminOrder[]
      try {
        result = await api<AdminOrder[]>('/admin/orders', { query: { status: 'awaiting-transfer' } })
      } catch (e) {
        if (!import.meta.dev || !isBackendUnreachable(e)) throw e
        console.warn('[useAdminTransfers] /admin/orders unavailable, using dev mock data:', e)
        result = mockTransfers()
      }
      orders.value = result
      status.value = 'success'
    } catch (e) {
      error.value = toApiError(e)
      status.value = 'error'
    }
  }

  // 409 (the order is no longer awaiting validation, e.g. another admin already decided it) surfaces as
  // an error toast like any other failure; the row stays so the admin sees nothing was applied.
  async function decide(orderId: string, decision: TransferDecision) {
    if (deciding.value[orderId]) return false
    deciding.value[orderId] = decision
    try {
      try {
        await api<AdminOrder>(`/admin/orders/${orderId}/${decision}-transfer`, { method: 'POST' })
      } catch (e) {
        if (!import.meta.dev || !isBackendUnreachable(e)) throw e
        console.warn(`[useAdminTransfers] ${decision}-transfer backend unavailable, applying to dev mock data only:`, e)
      }
      orders.value = orders.value.filter((order) => order.id !== orderId)
      toast.success(decision === 'approve' ? 'Transferencia aprobada. El pedido sigue con la entrega.' : 'Transferencia rechazada. El pedido quedó cancelado.')
      return true
    } catch (e) {
      toast.error(toApiError(e).friendlyMessage())
      return false
    } finally {
      deciding.value[orderId] = undefined
    }
  }

  const approve = (orderId: string) => decide(orderId, 'approve')
  const reject = (orderId: string) => decide(orderId, 'reject')

  return { orders, status, error, deciding, load, approve, reject }
}
