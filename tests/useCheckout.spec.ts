import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createFetch } from 'ofetch'
import { clearNuxtState } from '#app'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ApiError } from '~/composables/useApi'
import { useCart } from '~/composables/useCart'
import { DEFAULT_PAYMENT_METHOD, isValidPhone, LAST_ORDER_STORAGE_KEY, PAYMENT_METHODS, useCheckout } from '~/composables/useCheckout'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn(async (_to: unknown) => {}) }))
mockNuxtImport('useSupabaseClient', () => () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }))
mockNuxtImport('navigateTo', () => navigateToMock)

const line = { variantId: 'v1', productSlug: 'riot-points', productName: 'Riot Points', variantName: '1.750 RP', unitPrice: 9990, currency: 'ARS' }

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/problem+json' } }),
  )
  vi.stubGlobal('$fetch', createFetch({ fetch: fetchMock, Headers }))
  return fetchMock
}

function sentRequest(fetchMock: ReturnType<typeof stubFetch>) {
  const [url, init] = fetchMock.mock.calls[0] ?? []
  return { url: String(url), method: init?.method, body: JSON.parse(String(init?.body)) as unknown }
}

const assign = vi.fn<(url: string | URL) => void>()

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  clearNuxtState()
  assign.mockClear()
  navigateToMock.mockClear()
  vi.spyOn(window.location, 'assign').mockImplementation(assign)
})

describe('useCheckout', () => {
  it('posts only variant ids, quantities, the email and the method, then redirects to Mercado Pago', async () => {
    const cart = useCart()
    cart.add(line, 2)
    cart.add({ ...line, variantId: 'v2' })
    const fetchMock = stubFetch(201, { orderId: 'order-1', initPoint: 'https://mp.test/init' })
    const checkout = useCheckout()

    const pending = checkout.submit(' buyer@example.com ')
    expect(checkout.status.value).toBe('submitting')
    await expect(pending).resolves.toBe(true)

    const request = sentRequest(fetchMock)
    expect(request.url).toBe('http://localhost:8080/checkout/orders')
    expect(request.method).toBe('POST')
    expect(request.body).toEqual({ email: 'buyer@example.com', items: [{ variantId: 'v1', quantity: 2 }, { variantId: 'v2', quantity: 1 }], paymentMethod: 'mercadopago' })
    expect(JSON.stringify(request.body)).not.toContain('9990')

    expect(checkout.status.value).toBe('redirecting')
    expect(sessionStorage.getItem(LAST_ORDER_STORAGE_KEY)).toBe('order-1')
    expect(assign).toHaveBeenCalledWith('https://mp.test/init')
    // The cart survives the hand-off; only the result page clears it.
    expect(cart.lines.value).toHaveLength(2)
  })

  it('preselects Mercado Pago and sends it as the method, without a phone', async () => {
    useCart().add(line)
    const fetchMock = stubFetch(201, { orderId: 'order-2', initPoint: 'https://mp.test/init' })
    const checkout = useCheckout()

    expect(checkout.paymentMethod.value).toBe('mercadopago')
    expect(DEFAULT_PAYMENT_METHOD).toBe('mercadopago')
    expect(PAYMENT_METHODS.map((m) => m.id)).toEqual(['mercadopago', 'bank-transfer'])

    await expect(checkout.submit('buyer@example.com', '1123456789')).resolves.toBe(true)
    expect(Object.keys(sentRequest(fetchMock).body as object)).toEqual(['email', 'items', 'paymentMethod'])
    expect(navigateToMock).not.toHaveBeenCalled()
    expect(checkout.status.value).toBe('redirecting')
  })

  it('refuses to submit without a payment method', async () => {
    useCart().add(line)
    const fetchMock = stubFetch(201, {})
    const checkout = useCheckout()
    checkout.paymentMethod.value = null

    await expect(checkout.submit('buyer@example.com')).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(checkout.status.value).toBe('idle')
  })

  it('exposes the ApiError and its field message on 422', async () => {
    useCart().add(line)
    stubFetch(422, { type: 'about:blank', title: 'Validation failed', status: 422, errors: { email: ['Buyer email is invalid'] } })
    const checkout = useCheckout()

    await expect(checkout.submit('buyer@example.com')).resolves.toBe(false)

    expect(checkout.status.value).toBe('error')
    expect(checkout.error.value).toBeInstanceOf(ApiError)
    expect(checkout.error.value?.status).toBe(422)
    expect(checkout.errorMessage.value).toBe('Buyer email is invalid')
    expect(assign).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(LAST_ORDER_STORAGE_KEY)).toBeNull()
  })

  it('shows the gateway-unavailable copy on 503', async () => {
    useCart().add(line)
    stubFetch(503, { type: 'about:blank', title: 'Payment gateway unavailable', status: 503 })
    const checkout = useCheckout()

    await checkout.submit('buyer@example.com')

    expect(checkout.status.value).toBe('error')
    expect(checkout.errorMessage.value).toBe('Pagos no disponibles por el momento')
  })

  it('never calls the API with an empty or malformed email, or an empty cart', async () => {
    const fetchMock = stubFetch(201, {})
    const checkout = useCheckout()

    await expect(checkout.submit('buyer@example.com')).resolves.toBe(false)
    useCart().add(line)
    await expect(checkout.submit('')).resolves.toBe(false)
    await expect(checkout.submit('not-an-email')).resolves.toBe(false)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(checkout.status.value).toBe('idle')
  })

  describe('bank transfer', () => {
    it('sends the method and the phone, keeps the order id, clears the cart and goes to the result page', async () => {
      const cart = useCart()
      cart.add(line, 2)
      const fetchMock = stubFetch(201, { orderId: 'order-t1', initPoint: null })
      const checkout = useCheckout()
      checkout.paymentMethod.value = 'bank-transfer'

      await expect(checkout.submit('buyer@example.com', ' +54 9 11 2345-6789 ')).resolves.toBe(true)

      expect(sentRequest(fetchMock).body).toEqual({
        email: 'buyer@example.com',
        items: [{ variantId: 'v1', quantity: 2 }],
        paymentMethod: 'bank-transfer',
        phone: '+54 9 11 2345-6789',
      })
      expect(sessionStorage.getItem(LAST_ORDER_STORAGE_KEY)).toBe('order-t1')
      expect(navigateToMock).toHaveBeenCalledWith({ path: '/checkout/result', query: { orderId: 'order-t1', method: 'bank-transfer' } })
      expect(assign).not.toHaveBeenCalled()
      // The transfer order is final, so unlike Mercado Pago the cart does not survive.
      expect(cart.lines.value).toHaveLength(0)
    })

    it('never calls the API without a valid phone', async () => {
      useCart().add(line)
      const fetchMock = stubFetch(201, {})
      const checkout = useCheckout()
      checkout.paymentMethod.value = 'bank-transfer'

      await expect(checkout.submit('buyer@example.com')).resolves.toBe(false)
      await expect(checkout.submit('buyer@example.com', '1234')).resolves.toBe(false)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(checkout.status.value).toBe('idle')
    })

    it('keeps the cart and exposes the phone field error on 422', async () => {
      const cart = useCart()
      cart.add(line)
      stubFetch(422, { type: 'about:blank', title: 'Validation failed', status: 422, errors: { phone: ['Phone is invalid'] } })
      const checkout = useCheckout()
      checkout.paymentMethod.value = 'bank-transfer'

      await expect(checkout.submit('buyer@example.com', '1123456789')).resolves.toBe(false)
      expect(checkout.error.value?.problem.errors?.phone).toEqual(['Phone is invalid'])
      expect(cart.lines.value).toHaveLength(1)
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('shows the transfers-unavailable copy on 503', async () => {
      useCart().add(line)
      stubFetch(503, { type: 'about:blank', title: 'Bank transfers disabled', status: 503 })
      const checkout = useCheckout()
      checkout.paymentMethod.value = 'bank-transfer'

      await checkout.submit('buyer@example.com', '1123456789')
      expect(checkout.errorMessage.value).toBe('Las transferencias no están disponibles por el momento')
    })

    it('loads the destination account on 200 and hides transfers on 404', async () => {
      const details = { alias: 'chekeys.pagos', accountHolder: 'Chekeys SRL', cbu: null }
      const fetchMock = stubFetch(200, details)
      const checkout = useCheckout()
      await expect(checkout.loadTransferDetails()).resolves.toEqual(details)
      expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://localhost:8080/checkout/bank-transfer')

      stubFetch(404, { type: 'about:blank', title: 'Not Found', status: 404 })
      const disabled = useCheckout()
      disabled.paymentMethod.value = 'bank-transfer'
      await expect(disabled.loadTransferDetails()).resolves.toBeNull()
      expect(disabled.transferDetails.value).toBeNull()
      // A method that is no longer offered falls back to the default.
      expect(disabled.paymentMethod.value).toBe('mercadopago')
    })

    it('validates 8–15 digits after stripping separators and a leading +', () => {
      expect(isValidPhone('11 2345-6789')).toBe(true)
      expect(isValidPhone('+54 (11) 2345-6789')).toBe(true)
      expect(isValidPhone('1234567')).toBe(false)
      expect(isValidPhone('1234567890123456')).toBe(false)
      expect(isValidPhone('11-2345-abcd')).toBe(false)
    })
  })
})
