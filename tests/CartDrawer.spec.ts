import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { clearNuxtState } from '#app'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CartDrawer from '~/components/cart/CartDrawer.vue'
import { useCart } from '~/composables/useCart'

const line = { variantId: 'v1', productSlug: 'riot-points', productName: 'Riot Points', variantName: '1.750 RP', unitPrice: 9990, currency: 'ARS' }

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

beforeEach(() => {
  localStorage.clear()
  clearNuxtState()
})
// Teleported content lives in document.body; unmount so a stale drawer never reacts to the next test.
afterEach(() => wrapper?.unmount())

describe('CartDrawer', () => {
  it('renders the empty state when open with no lines', async () => {
    const cart = useCart()
    cart.open()
    wrapper = await mountSuspended(CartDrawer)

    expect(document.body.textContent).toContain('Tu carrito está vacío.')
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
})
