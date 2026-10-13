import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { clearNuxtState } from '#app'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { ApiError } from '~/composables/useApi'
import { useCart } from '~/composables/useCart'
import CheckoutPage from '~/pages/checkout/index.vue'

const { apiMock, navigateToMock } = vi.hoisted(() => ({ apiMock: vi.fn(), navigateToMock: vi.fn(async (_to: unknown) => {}) }))
mockNuxtImport('useApi', () => () => apiMock)
mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useAuth', () => () => ({ email: ref(null) }))

const line = { variantId: 'v1', productSlug: 'riot-points', productName: 'Riot Points', variantName: '1.750 RP', unitPrice: 9990, currency: 'ARS' }
const transferDetails = { alias: 'chekeys.pagos', accountHolder: 'Chekeys SRL', cbu: '0000003100000000000001' }

// Routes the mocked api by URL: the transfer config answers 200 (enabled) or 404 (disabled).
function stubApi({ transfers, order }: { transfers: boolean; order?: () => Promise<unknown> }) {
  apiMock.mockImplementation(async (url: string) => {
    if (url === '/checkout/bank-transfer') {
      if (transfers) return transferDetails
      throw new ApiError({ type: 'about:blank', title: 'Not Found', status: 404 })
    }
    if (url === '/checkout/orders') return order ? order() : { orderId: 'order-t1', initPoint: null }
    throw new Error(`unexpected ${url}`)
  })
}

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

async function mountPage() {
  wrapper = await mountSuspended(CheckoutPage, { attachTo: document.body })
  await flushPromises()
  return wrapper
}
function dialog() {
  return document.body.querySelector<HTMLElement>('[role="dialog"]')
}
function dialogButton(label: string) {
  return Array.from(dialog()?.querySelectorAll<HTMLButtonElement>('button') ?? []).find((b) => b.textContent?.trim() === label)
}
function orderCalls() {
  return apiMock.mock.calls.filter(([url]) => url === '/checkout/orders')
}
async function chooseTransfer(page: NonNullable<typeof wrapper>) {
  await page.findAll('input[type="radio"]')[1]!.trigger('change')
}
async function fillContact(page: NonNullable<typeof wrapper>, phone: string) {
  await page.find('input[type="email"]').setValue('buyer@example.com')
  await page.find('input[type="tel"]').setValue(phone)
}

beforeEach(() => {
  apiMock.mockReset()
  navigateToMock.mockClear()
  localStorage.clear()
  sessionStorage.clear()
  clearNuxtState()
  useCart().add(line, 2)
})
// The confirmation dialog teleports into document.body; unmount so it never leaks into the next test.
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('pages/checkout — bank transfer', () => {
  it('offers only Mercado Pago when transfers are disabled (404)', async () => {
    stubApi({ transfers: false })
    const page = await mountPage()

    expect(page.findAll('input[type="radio"]')).toHaveLength(1)
    expect(page.text()).not.toContain('Transferencia bancaria')
    expect(page.text()).toContain('Pagar con Mercado Pago')
  })

  it('offers the transfer when enabled and swaps in the phone, account details and "Ya transferí"', async () => {
    stubApi({ transfers: true })
    const page = await mountPage()

    expect(page.findAll('input[type="radio"]')).toHaveLength(2)
    expect(page.text()).toContain('Transferí desde tu banco o billetera virtual')
    // Mercado Pago stays the default: nothing transfer-specific shows yet.
    expect(page.find('input[type="tel"]').exists()).toBe(false)
    expect(page.find('[data-bank-transfer]').exists()).toBe(false)

    await chooseTransfer(page)

    const tel = page.find('input[type="tel"]')
    expect(tel.attributes('autocomplete')).toBe('tel')
    expect(tel.attributes('inputmode')).toBe('tel')
    expect(page.find('[data-transfer-alias]').text()).toBe('chekeys.pagos')
    expect(page.find('[data-bank-transfer]').text()).toContain('Chekeys SRL')
    expect(page.find('[data-bank-transfer]').text()).toContain('0000003100000000000001')
    expect(page.find('[data-transfer-amount]').text()).toBe(formatMoney(19980, 'ARS'))
    expect(page.text()).toContain('Ya transferí')
    expect(page.text()).not.toContain('Pagar con Mercado Pago')
  })

  it('validates the phone before opening the confirmation', async () => {
    stubApi({ transfers: true })
    const page = await mountPage()
    await chooseTransfer(page)
    await fillContact(page, '1234')

    await page.find('form').trigger('submit')
    await nextTick()

    expect(dialog()).toBeNull()
    expect(page.find('[data-phone-error]').text()).toContain('Ingresá un teléfono válido')
    expect(orderCalls()).toHaveLength(0)
  })

  it('only submits the order once the confirmation modal is accepted', async () => {
    stubApi({ transfers: true })
    const page = await mountPage()
    await chooseTransfer(page)
    await fillContact(page, '11 2345-6789')

    await page.find('form').trigger('submit')
    await nextTick()
    expect(dialog()?.textContent).toContain('chekeys.pagos')
    expect(dialog()?.textContent).toContain(formatMoney(19980, 'ARS'))
    expect(orderCalls()).toHaveLength(0)

    // "Volver" backs out without creating anything.
    dialogButton('Volver')!.click()
    await nextTick()
    expect(dialog()).toBeNull()
    expect(orderCalls()).toHaveLength(0)

    await page.find('form').trigger('submit')
    await nextTick()
    dialogButton('Sí, ya transferí')!.click()
    await flushPromises()

    expect(orderCalls()).toHaveLength(1)
    expect(orderCalls()[0]![1]).toEqual({
      method: 'POST',
      body: { email: 'buyer@example.com', items: [{ variantId: 'v1', quantity: 2 }], paymentMethod: 'bank-transfer', phone: '11 2345-6789' },
    })
    expect(navigateToMock).toHaveBeenCalledWith({ path: '/checkout/result', query: { orderId: 'order-t1', method: 'bank-transfer' } })
  })

  it('shows a 422 phone error under the phone field', async () => {
    stubApi({
      transfers: true,
      order: async () => { throw new ApiError({ type: 'about:blank', title: 'Validation failed', status: 422, errors: { phone: ['El teléfono no es válido.'] } }) },
    })
    const page = await mountPage()
    await chooseTransfer(page)
    await fillContact(page, '1123456789')

    await page.find('form').trigger('submit')
    await nextTick()
    dialogButton('Sí, ya transferí')!.click()
    await flushPromises()

    expect(dialog()).toBeNull()
    expect(page.find('[data-phone-error]').text()).toBe('El teléfono no es válido.')
    // The email field stays clean: the 422 belongs to the phone.
    expect(page.find('input[type="email"]').attributes('aria-invalid')).toBe('false')
  })

  it('shows a 422 payment-method error next to the pay button, not under the email', async () => {
    stubApi({
      transfers: true,
      order: async () => { throw new ApiError({ type: 'about:blank', title: 'Unprocessable Entity', status: 422, errors: { paymentMethod: ['Método de pago inválido.'] } }) },
    })
    const page = await mountPage()
    await chooseTransfer(page)
    await fillContact(page, '1123456789')

    await page.find('form').trigger('submit')
    await nextTick()
    dialogButton('Sí, ya transferí')!.click()
    await flushPromises()

    expect(page.find('p.text-center[role="alert"]').text()).toBe('Método de pago inválido.')
    expect(page.find('input[type="email"]').attributes('aria-invalid')).toBe('false')
  })
})
