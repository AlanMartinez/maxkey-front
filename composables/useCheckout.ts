import type { BankTransferDetails, CheckoutPaymentMethod, CreateOrderRequest, CreateOrderResponse } from '~/types/api'
import { ApiError } from '~/composables/useApi'

export const LAST_ORDER_STORAGE_KEY = 'chekeys.lastOrderId'
export type CheckoutStatus = 'idle' | 'submitting' | 'redirecting' | 'error'

/**
 * Payment methods offered at checkout. Chosen client-side and sent as `paymentMethod` in
 * `POST /checkout/orders`. Bank transfer is only offered while `GET /checkout/bank-transfer` returns 200.
 */
export type PaymentMethod = CheckoutPaymentMethod
export interface PaymentMethodOption { id: PaymentMethod; name: string; description: string }
export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  { id: 'mercadopago', name: 'Mercado Pago', description: 'Tarjetas, dinero en cuenta y más' },
  { id: 'bank-transfer', name: 'Transferencia bancaria', description: 'Transferí desde tu banco o billetera virtual' },
]
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'mercadopago'

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Client-side shape check only; the server is authoritative (422 on invalid email). */
export function isValidEmail(email: string) {
  return EMAIL_SHAPE.test(email.trim())
}

// Separators people type in a phone number; a leading + (international prefix) is forgiven too.
const PHONE_SEPARATORS = /[\s\-()]/g
/** Digits-only form used for the client-side check. The raw input is what travels: the server normalizes it. */
export function phoneDigits(phone: string) {
  return phone.trim().replace(/^\+/, '').replace(PHONE_SEPARATORS, '')
}
/** Client-side shape check only (8–15 digits); the server is authoritative (422 with `errors.phone`). */
export function isValidPhone(phone: string) {
  return /^\d{8,15}$/.test(phoneDigits(phone))
}

/** Maps checkout failures to user copy: 503 = gateway (or transfers) down, 422 = field message from Problem Details. */
export function checkoutErrorMessage(error: ApiError | null, method: PaymentMethod = DEFAULT_PAYMENT_METHOD) {
  if (!error) return null
  if (error.status === 503) return method === 'bank-transfer' ? 'Las transferencias no están disponibles por el momento' : 'Pagos no disponibles por el momento'
  const fieldMessage = error.problem.errors ? Object.values(error.problem.errors)[0]?.[0] : undefined
  return fieldMessage ?? error.detail ?? error.title
}

/**
 * Checkout flow (design §6a/§9): create the order, remember its id, then
 * - Mercado Pago: hand off to the gateway. The cart is deliberately kept until the result page confirms
 *   payment, so a rejected payment stays retryable.
 * - Bank transfer: the buyer already transferred, so the order is final — clear the cart and go straight
 *   to the result page, which shows the "validating your transfer" state.
 */
export function useCheckout() {
  const api = useApi()
  const { lines, clear } = useCart()
  const status = ref<CheckoutStatus>('idle')
  const error = ref<ApiError | null>(null)
  // Required selection; pre-set to Mercado Pago, which is always offered.
  const paymentMethod = ref<PaymentMethod | null>(DEFAULT_PAYMENT_METHOD)
  const errorMessage = computed(() => checkoutErrorMessage(error.value, paymentMethod.value ?? DEFAULT_PAYMENT_METHOD))

  // Destination account for transfers; null while loading, on 404 (transfers disabled) or on any failure,
  // which simply hides the option — Mercado Pago keeps working either way.
  const transferDetails = ref<BankTransferDetails | null>(null)
  async function loadTransferDetails() {
    try {
      transferDetails.value = await api<BankTransferDetails>('/checkout/bank-transfer')
    } catch {
      transferDetails.value = null
    }
    if (!transferDetails.value && paymentMethod.value === 'bank-transfer') paymentMethod.value = DEFAULT_PAYMENT_METHOD
    return transferDetails.value
  }

  async function submit(email: string, phone = '') {
    const trimmed = email.trim()
    const method = paymentMethod.value
    if (!isValidEmail(trimmed) || lines.value.length === 0 || status.value === 'submitting' || !method) return false
    if (method === 'bank-transfer' && !isValidPhone(phone)) return false
    status.value = 'submitting'
    error.value = null
    // Only ids and quantities travel; the server recomputes prices and names (cart-checkout spec).
    const body: CreateOrderRequest = {
      email: trimmed,
      items: lines.value.map(({ variantId, quantity }) => ({ variantId, quantity })),
      paymentMethod: method,
      ...(method === 'bank-transfer' ? { phone: phone.trim() } : {}),
    }
    try {
      const { orderId, initPoint } = await api<CreateOrderResponse>('/checkout/orders', { method: 'POST', body })
      sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, orderId)
      status.value = 'redirecting'
      if (method === 'bank-transfer') {
        // `method` is only a hint for the result page to skip the Mercado Pago reconcile straight away.
        await navigateTo({ path: '/checkout/result', query: { orderId, method } })
        clear()
      } else {
        window.location.assign(initPoint ?? '/checkout/result')
      }
      return true
    } catch (e) {
      error.value = e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
      status.value = 'error'
      return false
    }
  }

  return { status, error, errorMessage, paymentMethod, transferDetails, loadTransferDetails, submit }
}
