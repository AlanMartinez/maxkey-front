import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createFetch } from 'ofetch'
import { clearNuxtState } from '#app'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ApiError } from '~/composables/useApi'
import { useCart } from '~/composables/useCart'
import { LAST_ORDER_STORAGE_KEY, useCheckout } from '~/composables/useCheckout'

mockNuxtImport('useSupabaseSession', () => () => ref(null))

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
  vi.spyOn(window.location, 'assign').mockImplementation(assign)
})

describe('useCheckout', () => {
  it('posts only variant ids, quantities and the email, then redirects to Mercado Pago', async () => {
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
    expect(request.body).toEqual({ email: 'buyer@example.com', items: [{ variantId: 'v1', quantity: 2 }, { variantId: 'v2', quantity: 1 }] })
    expect(JSON.stringify(request.body)).not.toContain('9990')

    expect(checkout.status.value).toBe('redirecting')
    expect(sessionStorage.getItem(LAST_ORDER_STORAGE_KEY)).toBe('order-1')
    expect(assign).toHaveBeenCalledWith('https://mp.test/init')
    // The cart survives the hand-off; only the result page clears it.
    expect(cart.lines.value).toHaveLength(2)
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
})
