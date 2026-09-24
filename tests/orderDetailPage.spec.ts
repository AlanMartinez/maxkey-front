import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { DOMWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import OrderDetailPage from '~/pages/account/orders/[id].vue'
import type { OrderDetailDto, OrderItemDto } from '~/types/api'
import { WHATSAPP_NUMBER } from '~/utils/contact'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)
mockNuxtImport('useRoute', () => () => ({ params: { id: 'order-1' } }))

function buildItem(overrides: Partial<OrderItemDto> = {}): OrderItemDto {
  return { itemId: 'item-1', productName: 'Riot Points', variantName: '1.750 RP', unitPrice: 9990, quantity: 1, keys: [], revealable: true, ...overrides }
}

function buildOrder(items: OrderItemDto[]): OrderDetailDto {
  return { id: 'order-1', status: 'Delivered', totalAmount: 9990, currency: 'ARS', createdAt: '2026-09-20T12:00:00Z', items }
}

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

async function mountPage() {
  wrapper = await mountSuspended(OrderDetailPage)
  return wrapper
}
function revealButton(page: NonNullable<typeof wrapper>) {
  return page.findAll('button').find((b: DOMWrapper<Element>) => b.text() === 'Revelar key')!
}
function dialog() {
  return document.body.querySelector<HTMLElement>('[role="dialog"]')
}
function dialogButton(label: string) {
  return Array.from(dialog()?.querySelectorAll<HTMLButtonElement>('button') ?? []).find((b) => b.textContent?.trim() === label)
}
async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

beforeEach(() => {
  apiMock.mockReset()
})
// The confirmation dialog teleports into document.body; unmount so it never leaks into the next test.
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('pages/account/orders/[id] — reveal confirmation', () => {
  it('asks for confirmation before revealing and does not call the API until confirmed', async () => {
    apiMock.mockResolvedValueOnce(buildOrder([buildItem()]))
    const page = await mountPage()

    await revealButton(page).trigger('click')
    await nextTick()

    expect(apiMock).toHaveBeenCalledTimes(1) // only the order fetch
    expect(dialog()?.textContent).toContain('Antes de revelar tu key')
    expect(dialog()?.querySelector('a[href="/reembolsos"]')).not.toBeNull()
  })

  it('closes the dialog on cancel without revealing', async () => {
    apiMock.mockResolvedValueOnce(buildOrder([buildItem()]))
    const page = await mountPage()

    await revealButton(page).trigger('click')
    await nextTick()
    dialogButton('Cancelar')!.click()
    await nextTick()

    expect(dialog()).toBeNull()
    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(page.text()).not.toContain('ABCD-1234')
  })

  it('reveals through the API only after the buyer confirms', async () => {
    apiMock.mockResolvedValueOnce(buildOrder([buildItem()]))
    apiMock.mockResolvedValueOnce({ codes: ['ABCD-1234'] })
    const page = await mountPage()

    await revealButton(page).trigger('click')
    await nextTick()
    dialogButton('Revelar key')!.click()
    await settle()

    expect(apiMock).toHaveBeenCalledWith('/me/orders/order-1/items/item-1/keys/reveal', { method: 'POST' })
    expect(dialog()).toBeNull()
    expect(page.find('.key-reveal').exists()).toBe(true)
  })
})

describe('pages/account/orders/[id] — activation help next to the keys', () => {
  it('links the activation guide and a WhatsApp help chat carrying the order id', async () => {
    apiMock.mockResolvedValueOnce(buildOrder([buildItem({ keys: ['ABCD-1234'], activationGuideSlug: 'activar-riot', productSlug: 'riot-points' })]))
    const page = await mountPage()

    const help = page.find('[data-testid="item-help"]')
    expect(help.find('a[href="/article/activar-riot"]').text()).toBe('Guía de activación')
    expect(help.find('a[href="/product/riot-points"]').exists()).toBe(false)
    const whatsapp = help.findAll('a').find((a: DOMWrapper<Element>) => a.text() === '¿Problemas con esta key?')
    expect(whatsapp?.attributes('href')?.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`)).toBe(true)
    expect(decodeURIComponent(whatsapp?.attributes('href') ?? '')).toContain('order-1')
  })

  it('falls back to the product page when the product has no activation guide', async () => {
    apiMock.mockResolvedValueOnce(buildOrder([buildItem({ keys: ['ABCD-1234'], activationGuideSlug: null, productSlug: 'riot-points' })]))
    const page = await mountPage()

    const help = page.find('[data-testid="item-help"]')
    expect(help.find('a[href="/product/riot-points"]').text()).toBe('Ver producto')
    expect(help.text()).not.toContain('Guía de activación')
  })

  it('shows only the WhatsApp help when the backend has not shipped the slugs yet', async () => {
    apiMock.mockResolvedValueOnce(buildOrder([buildItem({ keys: ['ABCD-1234'] })]))
    const page = await mountPage()

    const help = page.find('[data-testid="item-help"]')
    expect(help.findAll('a')).toHaveLength(1)
    expect(help.text()).toContain('¿Problemas con esta key?')
  })
})
