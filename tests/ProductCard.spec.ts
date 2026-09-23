import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFetch } from 'ofetch'
import { clearNuxtState } from '#app'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import ProductCard from '~/components/catalog/ProductCard.vue'
import { useCart } from '~/composables/useCart'

mockNuxtImport('useSupabaseClient', () => () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }))

const product = { id: 'p1', slug: 'riot-points', name: 'Riot Points', platform: 'Riot Games', imageUrl: 'https://cdn/x.png', fromPrice: 9990, oldPrice: 11350 }
const variants = [
  { id: 'v1', name: '1.750 RP', region: 'LAS', price: 9990, currency: 'ARS' },
  { id: 'v2', name: '3.500 RP', region: 'LAS', price: 18500, currency: 'ARS' },
]

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
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

describe('ProductCard', () => {
  it('links to the product page and shows platform, price and discount', async () => {
    const wrapper = await mountSuspended(ProductCard, { props: { product } })

    expect(wrapper.find('a').attributes('href')).toBe('/product/riot-points')
    expect(wrapper.text()).toContain('Riot Games')
    expect(wrapper.text()).toContain('9.990')
    expect(wrapper.text()).toContain('-12%')
  })

  it('shows the platform logo instead of its name for a known platform', async () => {
    const wrapper = await mountSuspended(ProductCard, { props: { product: { ...product, platform: 'Steam' } } })

    const logo = wrapper.find('img[alt="Steam"]')
    expect(logo.attributes('src')).toBe('/images/platforms/steam.svg')
    expect(wrapper.text()).not.toContain('Steam')
  })

  it('hides the discount badge without an old price', async () => {
    const wrapper = await mountSuspended(ProductCard, { props: { product: { ...product, oldPrice: undefined } } })

    expect(wrapper.text()).not.toContain('%')
  })

  it('keeps the green discount badge and no offer ribbon at exactly 50%', async () => {
    const wrapper = await mountSuspended(ProductCard, { props: { product: { ...product, fromPrice: 5000, oldPrice: 10000 } } })

    expect(wrapper.find('.bg-discount').text()).toBe('-50%')
    expect(wrapper.find('[data-testid="offer-ribbon"]').exists()).toBe(false)
  })

  it('shows an orange offer badge and ribbon above 50%', async () => {
    const wrapper = await mountSuspended(ProductCard, { props: { product: { ...product, fromPrice: 4900, oldPrice: 10000 } } })

    expect(wrapper.findAll('[class*="bg-amber-500"]').some((element) => element.text() === '-51%')).toBe(true)
    expect(wrapper.find('[data-testid="offer-ribbon"]').text()).toBe('OFERTA')
    expect(wrapper.find('[data-testid="offer-ribbon"]').attributes('aria-label')).toBe('Oferta especial')
  })

  it('adds the default variant to the cart from the card without navigating', async () => {
    const fetchMock = stubFetch(200, { ...product, description: 'RP', variants })
    const cart = useCart()
    const wrapper = await mountSuspended(ProductCard, { props: { product } })
    const button = wrapper.find('button')

    expect(button.text()).toBe('Agregar al carrito')
    // The button lives outside the anchor, so a click can never bubble into the router link.
    expect(button.element.closest('a')).toBeNull()

    await button.trigger('click')
    await settle()

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://localhost:8080/catalog/products/riot-points')
    expect(cart.lines.value).toEqual([expect.objectContaining({ variantId: 'v1', productSlug: 'riot-points', variantName: '1.750 RP', unitPrice: 9990, quantity: 1 })])
    expect(wrapper.find('button').text()).toBe('Agregado ✓')
  })

  it('reverts the confirmation after a short delay', async () => {
    stubFetch(200, { ...product, description: 'RP', variants })
    const wrapper = await mountSuspended(ProductCard, { props: { product } })

    await wrapper.find('button').trigger('click')
    await settle()
    expect(wrapper.find('button').text()).toBe('Agregado ✓')

    await new Promise((resolve) => setTimeout(resolve, 1600))
    expect(wrapper.find('button').text()).toBe('Agregar al carrito')
  })

  it('shows an error label when the detail request fails and leaves the cart untouched', async () => {
    stubFetch(500, { type: 'about:blank', title: 'boom', status: 500 })
    const cart = useCart()
    const wrapper = await mountSuspended(ProductCard, { props: { product } })

    await wrapper.find('button').trigger('click')
    await settle()

    expect(cart.isEmpty.value).toBe(true)
    expect(wrapper.find('button').text()).toBe('No se pudo agregar')
  })
})
