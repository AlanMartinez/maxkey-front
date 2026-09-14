import type { AdminBuyer, AdminBuyersPage, ResendDeliveryResponse } from '~/types/api'
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

  return { email, page, pageSize, buyers, total, status, error, load, search, goToPage, resending, resendError, resendSuccess, resendDelivery }
}
