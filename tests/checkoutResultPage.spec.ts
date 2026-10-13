import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { OrderStatusResponse } from '~/types/api'
import ResultPage from '~/pages/checkout/result.vue'

const { apiMock, routeQuery } = vi.hoisted(() => ({ apiMock: vi.fn(), routeQuery: { value: {} as Record<string, string> } }))
mockNuxtImport('useApi', () => () => apiMock)
mockNuxtImport('useRoute', () => () => ({ query: routeQuery.value }))
mockNuxtImport('useAuth', () => () => ({ isAuthenticated: ref(false), openLogin: vi.fn() }))

function statusResponse(overrides: Partial<OrderStatusResponse> = {}): OrderStatusResponse {
  return { orderId: 'order-t1', status: 'AwaitingTransferValidation', buyerEmailMasked: 'b***@example.com', totalAmount: 19980, currency: 'ARS', paymentMethod: 'bank-transfer', ...overrides }
}

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

async function mountPage() {
  wrapper = await mountSuspended(ResultPage)
  await flushPromises()
  return wrapper
}
function calledUrls() {
  return apiMock.mock.calls.map(([url]) => url as string)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  apiMock.mockReset()
  sessionStorage.clear()
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
})

describe('pages/checkout/result — bank transfer', () => {
  it('shows the "validating your transfer" state after a single status fetch, never reconciling', async () => {
    routeQuery.value = { orderId: 'order-t1', method: 'bank-transfer' }
    apiMock.mockResolvedValue(statusResponse())
    const page = await mountPage()
    await vi.advanceTimersByTimeAsync(10_000)

    expect(page.find('h1').text()).toBe('Recibimos tu pedido')
    expect(page.text()).toContain('Estamos validando tu transferencia')
    expect(page.text()).toContain(formatMoney(19980, 'ARS'))
    expect(page.find('[data-transfer-pending]').exists()).toBe(true)
    expect(calledUrls()).toEqual(['/checkout/orders/order-t1/status'])
  })

  it('detects a transfer from the status response alone (no URL hint) and still skips Mercado Pago', async () => {
    routeQuery.value = {}
    sessionStorage.setItem('chekeys.lastOrderId', 'order-t1')
    apiMock.mockResolvedValue(statusResponse())
    const page = await mountPage()
    await vi.advanceTimersByTimeAsync(10_000)

    expect(page.find('h1').text()).toBe('Recibimos tu pedido')
    expect(calledUrls().some((url) => url.endsWith('/reconcile'))).toBe(false)
    expect(calledUrls()).toHaveLength(1)
  })

  it('shows a transfer-specific message without a retry when the transfer was rejected', async () => {
    routeQuery.value = { orderId: 'order-t1', method: 'bank-transfer' }
    apiMock.mockResolvedValue(statusResponse({ status: 'Cancelled' }))
    const page = await mountPage()

    expect(page.find('h1').text()).toBe('No pudimos validar tu transferencia')
    expect(page.text()).not.toContain('Reintentar')
  })

  it('keeps reconciling Mercado Pago orders that come back from the gateway', async () => {
    routeQuery.value = { external_reference: 'order-mp', status: 'approved' }
    apiMock.mockResolvedValue(statusResponse({ orderId: 'order-mp', status: 'Paid', paymentMethod: 'mercadopago' }))
    const page = await mountPage()

    expect(calledUrls()[0]).toBe('/checkout/orders/order-mp/reconcile')
    expect(page.find('h1').text()).toBe('Pago aprobado')
  })
})
