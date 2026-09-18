import type { AdminBuyer, AdminBuyersPage, AssignKeysResponse, DeliverOrderResponse, ResendDeliveryResponse } from '~/types/api'
import { ApiError } from '~/composables/useApi'

/**
 * Admin buyers listing (search + pagination) and per-order delivery-email resend
 * (admin-buyers spec: Buyer Listing Grouped By Email, Resend Delivery Email; design D4).
 * Resend state is tracked per `orderId` so multiple orders on the page can resend independently
 * without one order's pending/error state leaking into another's.
 */
export function useAdminBuyers() {
  const api = useApi()

  const email = ref('')
  const page = ref(1)
  const pageSize = ref(20)

  const buyers = ref<AdminBuyer[]>([])
  const total = ref(0)
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const error = ref<ApiError | null>(null)

  function toApiError(e: unknown) {
    return e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
  }

  async function load() {
    status.value = 'pending'
    error.value = null
    try {
      const result = await api<AdminBuyersPage>('/admin/buyers', {
        query: { email: email.value || undefined, page: page.value, pageSize: pageSize.value },
      })
      buyers.value = result.items
      total.value = result.total
      status.value = 'success'
    } catch (e) {
      error.value = toApiError(e)
      status.value = 'error'
    }
  }

  function search(term: string) {
    email.value = term
    page.value = 1
    return load()
  }

  function goToPage(nextPage: number) {
    page.value = nextPage
    return load()
  }

  const resending = ref<Record<string, boolean>>({})
  const resendError = ref<Record<string, ApiError | null>>({})
  const resendSuccess = ref<Record<string, boolean>>({})

  async function resendDelivery(orderId: string) {
    resending.value[orderId] = true
    resendError.value[orderId] = null
    resendSuccess.value[orderId] = false
    try {
      await api<ResendDeliveryResponse>(`/admin/orders/${orderId}/resend-delivery`, { method: 'POST' })
      resendSuccess.value[orderId] = true
      return true
    } catch (e) {
      resendError.value[orderId] = toApiError(e)
      return false
    } finally {
      resending.value[orderId] = false
    }
  }

  // key-delivery-gate (PR #49): find the order in local state to patch its status in place after
  // assign/deliver succeeds, so button visibility recomputes without a full page refetch.
  function findOrder(orderId: string) {
    for (const buyer of buyers.value) {
      const order = buyer.orders.find((o) => o.id === orderId)
      if (order) return order
    }
    return undefined
  }

  const assigning = ref<Record<string, boolean>>({})
  const assignError = ref<Record<string, ApiError | null>>({})
  const assignSuccess = ref<Record<string, boolean>>({})

  // "Asignar": retries auto-assignment (in case stock wasn't available at payment time).
  async function assignKeys(orderId: string) {
    assigning.value[orderId] = true
    assignError.value[orderId] = null
    assignSuccess.value[orderId] = false
    try {
      const result = await api<AssignKeysResponse>(`/admin/orders/${orderId}/assign-keys`, { method: 'POST' })
      const order = findOrder(orderId)
      if (order) order.status = result.orderStatus
      assignSuccess.value[orderId] = true
      return true
    } catch (e) {
      assignError.value[orderId] = toApiError(e)
      return false
    } finally {
      assigning.value[orderId] = false
    }
  }

  const delivering = ref<Record<string, boolean>>({})
  const deliverError = ref<Record<string, ApiError | null>>({})
  const deliverSuccess = ref<Record<string, boolean>>({})

  // "Entregar": only valid when KeysAssigned — API 409s otherwise (e.g. status changed between page
  // load and click), handled the same way as any other ApiError and shown inline via deliverError.
  async function deliverOrder(orderId: string) {
    delivering.value[orderId] = true
    deliverError.value[orderId] = null
    deliverSuccess.value[orderId] = false
    try {
      const result = await api<DeliverOrderResponse>(`/admin/orders/${orderId}/deliver`, { method: 'POST' })
      const order = findOrder(orderId)
      if (order) order.status = result.status
      deliverSuccess.value[orderId] = true
      return true
    } catch (e) {
      deliverError.value[orderId] = toApiError(e)
      return false
    } finally {
      delivering.value[orderId] = false
    }
  }

  return {
    email, page, pageSize, buyers, total, status, error, load, search, goToPage,
    resending, resendError, resendSuccess, resendDelivery,
    assigning, assignError, assignSuccess, assignKeys,
    delivering, deliverError, deliverSuccess, deliverOrder,
  }
}
