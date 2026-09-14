import type { CreateOrderRequest, CreateOrderResponse } from '~/types/api'
import { ApiError } from '~/composables/useApi'

export const LAST_ORDER_STORAGE_KEY = 'nexo.lastOrderId'
export type CheckoutStatus = 'idle' | 'submitting' | 'redirecting' | 'error'

/**
 * Payment methods offered at checkout. Client-side only for now: `POST /checkout/orders` does not accept a
 * method yet (Mercado Pago is the sole gateway), so the selection never travels in the request body.
 */
export type PaymentMethod = 'mercadopago'
export interface PaymentMethodOption { id: PaymentMethod; name: string; description: string }
export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  { id: 'mercadopago', name: 'Mercado Pago', description: 'Tarjetas, dinero en cuenta y más' },
]
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'mercadopago'

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Client-side shape check only; the server is authoritative (422 on invalid email). */
export function isValidEmail(email: string) {
  return EMAIL_SHAPE.test(email.trim())
}

/** Maps checkout failures to user copy: 503 = gateway down, 422 = field message from Problem Details. */
export function checkoutErrorMessage(error: ApiError | null) {
  if (!error) return null
  if (error.status === 503) return 'Pagos no disponibles por el momento'
  const fieldMessage = error.problem.errors ? Object.values(error.problem.errors)[0]?.[0] : undefined
  return fieldMessage ?? error.detail ?? error.title
}

/**
 * Checkout flow (design §6a/§9): create the order, remember its id, hand off to Mercado Pago.
 * The cart is deliberately kept until the result page confirms payment, so a rejected payment stays retryable.
 */
export function useCheckout() {
  const api = useApi()
  const { lines } = useCart()
  const status = ref<CheckoutStatus>('idle')
  const error = ref<ApiError | null>(null)
  const errorMessage = computed(() => checkoutErrorMessage(error.value))
  // Required selection; pre-set because a single method exists. See `PaymentMethod` above for why it stays client-side.
  const paymentMethod = ref<PaymentMethod | null>(DEFAULT_PAYMENT_METHOD)

  async function submit(email: string) {
    const trimmed = email.trim()
    if (!isValidEmail(trimmed) || lines.value.length === 0 || status.value === 'submitting' || !paymentMethod.value) return false
    status.value = 'submitting'
    error.value = null
    // Only ids and quantities travel; the server recomputes prices and names (cart-checkout spec).
    const body: CreateOrderRequest = { email: trimmed, items: lines.value.map(({ variantId, quantity }) => ({ variantId, quantity })) }
    try {
      const { orderId, initPoint } = await api<CreateOrderResponse>('/checkout/orders', { method: 'POST', body })
      sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, orderId)
      status.value = 'redirecting'
      window.location.assign(initPoint)
      return true
    } catch (e) {
      error.value = e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
      status.value = 'error'
      return false
    }
  }

  return { status, error, errorMessage, paymentMethod, submit }
}
