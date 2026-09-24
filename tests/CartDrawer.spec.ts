import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createFetch } from 'ofetch'
import { clearNuxtState } from '#app'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import CartDrawer from '~/components/cart/CartDrawer.vue'
import { useCart } from '~/composables/useCart'

mockNuxtImport('useSupabaseClient', () => () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }))

const line = { variantId: 'v1', productSlug: 'riot-points', productName: 'Riot Points', variantName: '1.750 RP', unitPrice: 9990, currency: 'ARS' }

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => { resolve = promiseResolve })
  return { promise, resolve }
}

function stubFetch(body: unknown) {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }),
  )
  vi.stubGlobal('$fetch', createFetch({ fetch: fetchMock, Headers }))
  return fetchMock
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  localStorage.clear()
  clearNuxtState()
})
// Teleported content lives in document.body; unmount so a stale drawer never reacts to the next test.
afterEach(() => {
  wrapper?.unmount()
  vi.unstubAllGlobals()
})

describe('CartDrawer', () => {
  it('renders the empty state when open with no lines', async () => {
    const cart = useCart()
    cart.open()
    wrapper = await mountSuspended(CartDrawer)

    expect(document.body.textContent).toContain('Tu carrito está vacío')
    expect(document.body.textContent).toContain('Elegí un producto, pagá con Mercado Pago y recibí tu key por email en minutos (máximo 24 h).')
    expect(document.body.textContent).not.toContain('al instante')
    expect(document.body.textContent).toContain('Ver ofertas')
    expect(document.body.textContent).not.toContain('Ir a pagar')
  })

  it('lists lines with subtotal and wires quantity and remove controls', async () => {
    const cart = useCart()
    cart.add(line, 2)
    cart.open()
    wrapper = await mountSuspended(CartDrawer)

    expect(document.body.textContent).toContain('1.750 RP')
    expect(document.body.textContent).toContain('19.980')
    expect(document.body.textContent).toContain('Ir a pagar')

    document.body.querySelector<HTMLButtonElement>('button[aria-label="Sumar"]')?.click()
    await nextTick()
    expect(cart.lines.value[0]?.quantity).toBe(3)

    document.body.querySelector<HTMLButtonElement>('button[aria-label="Cerrar"]')?.click()
    await nextTick()
    expect(cart.isOpen.value).toBe(false)
  })

  it('refreshes persisted line prices from the catalog when the cart opens', async () => {
    const fetchMock = stubFetch({ variants: [{ id: 'v1', price: 12500, currency: 'ARS' }] })
    const cart = useCart()
    cart.add(line)
    cart.open()
    wrapper = await mountSuspended(CartDrawer)
    await settle()

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://localhost:8080/catalog/products/riot-points')
    expect(cart.lines.value[0]).toEqual(expect.objectContaining({ unitPrice: 12500, currency: 'ARS' }))
    expect(document.body.textContent).toContain('12.500')
  })

  it('keeps the latest catalog price when refresh responses finish out of order', async () => {
    const first = deferred<Response>()
    const second = deferred<Response>()
    let requestCount = 0
    const fetchMock = vi.fn<typeof fetch>(() => {
      requestCount += 1
      return requestCount === 1 ? first.promise : second.promise
    })
    vi.stubGlobal('$fetch', createFetch({ fetch: fetchMock, Headers }))
    const cart = useCart()
    cart.add(line)
    cart.open()
    wrapper = await mountSuspended(CartDrawer)
    await nextTick()

    cart.close()
    await settle()
    cart.open()
    await settle()
    expect(fetchMock).toHaveBeenCalledTimes(2)

    second.resolve(new Response(JSON.stringify({ variants: [{ id: 'v1', price: 12500, currency: 'ARS' }] }), { status: 200, headers: { 'content-type': 'application/json' } }))
    await settle()
    first.resolve(new Response(JSON.stringify({ variants: [{ id: 'v1', price: 11000, currency: 'ARS' }] }), { status: 200, headers: { 'content-type': 'application/json' } }))
    await settle()

    expect(cart.lines.value[0]).toEqual(expect.objectContaining({ unitPrice: 12500, currency: 'ARS' }))
  })
})
