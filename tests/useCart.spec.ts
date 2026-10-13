import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { clearNuxtState } from '#app'
import { CART_STORAGE_KEY, CART_TTL_MS, useCart } from '~/composables/useCart'

const line = { variantId: 'v1', productSlug: 'riot-points', productName: 'Riot Points', variantName: '1.750 RP', unitPrice: 9990, currency: 'ARS', imageUrl: 'https://cdn/x.png' }

beforeEach(() => {
  localStorage.clear()
  // Drops the shared `useState` entries so each test gets a fresh composable instance.
  clearNuxtState()
})
afterEach(() => {
  vi.useRealTimers()
})

function persist(lines: unknown[], updatedAt = Date.now()) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ lines, updatedAt }))
}

describe('useCart', () => {
  it('adds a line and merges repeated variants into one line', () => {
    const cart = useCart()

    expect(cart.add(line)).toEqual({ ok: true })
    expect(cart.add(line, 2)).toEqual({ ok: true })

    expect(cart.lines.value).toHaveLength(1)
    expect(cart.lines.value[0]?.quantity).toBe(3)
    expect(cart.count.value).toBe(3)
    expect(cart.subtotal.value).toBe(29970)
    expect(cart.isEmpty.value).toBe(false)
  })

  it('clamps quantities to 1..10 on add and setQuantity', () => {
    const cart = useCart()

    cart.add(line, 15)
    expect(cart.lines.value[0]?.quantity).toBe(10)

    cart.setQuantity('v1', 0)
    expect(cart.lines.value[0]?.quantity).toBe(1)

    cart.setQuantity('v1', 11)
    expect(cart.lines.value[0]?.quantity).toBe(10)

    cart.add({ ...line, variantId: 'v2' }, 0)
    expect(cart.lines.value[1]?.quantity).toBe(1)
  })

  it('refuses the 21st distinct line but still merges existing ones', () => {
    const cart = useCart()
    for (let i = 0; i < 20; i++) cart.add({ ...line, variantId: `v${i}` })

    expect(cart.add({ ...line, variantId: 'v20' })).toEqual({ ok: false, reason: 'max-items' })
    expect(cart.lines.value).toHaveLength(20)
    expect(cart.add({ ...line, variantId: 'v0' })).toEqual({ ok: true })
    expect(cart.lines.value[0]?.quantity).toBe(2)
  })

  it('removes a single line and clears everything', () => {
    const cart = useCart()
    cart.add(line)
    cart.add({ ...line, variantId: 'v2' })

    cart.remove('v1')
    expect(cart.lines.value.map((l) => l.variantId)).toEqual(['v2'])

    cart.clear()
    expect(cart.isEmpty.value).toBe(true)
  })

  it('persists to localStorage and hydrates a fresh instance from it', async () => {
    const cart = useCart()
    cart.add(line, 2)
    await nextTick()

    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null')).toEqual({ lines: [{ ...line, quantity: 2 }], updatedAt: expect.any(Number) })

    clearNuxtState()
    const rehydrated = useCart()
    expect(rehydrated.lines.value).toEqual([{ ...line, quantity: 2 }])
    expect(rehydrated.count.value).toBe(2)
  })

  it('ignores corrupt or malformed persisted payloads', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{not json')
    expect(useCart().isEmpty.value).toBe(true)

    clearNuxtState()
    persist([{ nope: true }, { ...line, quantity: 99 }])
    expect(useCart().lines.value).toEqual([{ ...line, quantity: 10 }])
  })

  it('starts empty when the persisted cart is past its TTL or has no timestamp', () => {
    persist([{ ...line, quantity: 1 }], Date.now() - CART_TTL_MS)
    expect(useCart().isEmpty.value).toBe(true)
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull()

    clearNuxtState()
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ lines: [{ ...line, quantity: 1 }] }))
    expect(useCart().isEmpty.value).toBe(true)

    clearNuxtState()
    persist([{ ...line, quantity: 1 }], Date.now() - CART_TTL_MS + 60_000)
    expect(useCart().lines.value).toHaveLength(1)
  })

  it('empties an open cart once it has been idle for the full TTL, sliding with each change', async () => {
    vi.useFakeTimers()
    const cart = useCart()
    cart.add(line)
    await nextTick()

    vi.advanceTimersByTime(CART_TTL_MS - 1000)
    cart.setQuantity('v1', 2)
    await nextTick()
    vi.advanceTimersByTime(CART_TTL_MS - 1000)
    expect(cart.lines.value).toHaveLength(1)

    vi.advanceTimersByTime(1000)
    expect(cart.isEmpty.value).toBe(true)
  })

  it('drops lines no longer on sale and refreshes prices of the rest when syncing with the catalog', () => {
    const cart = useCart()
    cart.add(line)
    cart.add({ ...line, variantId: 'v2' })
    cart.add({ ...line, variantId: 'v3', productSlug: 'gone-product' })
    cart.add({ ...line, variantId: 'v4', productSlug: 'unreachable' })

    const removed = cart.syncCatalog([
      { productSlug: 'riot-points', variants: [{ variantId: 'v1', unitPrice: 12500, currency: 'ARS' }] },
      { productSlug: 'gone-product', variants: null },
    ])

    expect(removed).toBe(2)
    expect(cart.lines.value.map((l) => l.variantId)).toEqual(['v1', 'v4'])
    expect(cart.lines.value[0]?.unitPrice).toBe(12500)
  })

  it('toggles the drawer visibility', () => {
    const cart = useCart()
    expect(cart.isOpen.value).toBe(false)
    cart.open()
    expect(cart.isOpen.value).toBe(true)
    cart.toggle()
    expect(cart.isOpen.value).toBe(false)
  })
})
