import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { clearNuxtState } from '#app'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { AdminBuyer } from '~/types/api'
import BuyersPage from '~/pages/admin/buyers.vue'

const buyers = ref<AdminBuyer[]>([
  {
    email: 'buyer@example.com',
    orderCount: 2,
    lastPaidAt: '2026-01-02T00:00:00Z',
    orders: [
      {
        id: 'order-delivered',
        status: 'Delivered',
        paidAt: '2026-01-01T00:00:00Z',
        totalAmount: 9990,
        currency: 'ARS',
        items: [{ productName: 'Riot Points', variantName: '1.750 RP', quantity: 1, assignedKeys: 1, revealedKeys: 1 }],
      },
      {
        id: 'order-pending',
        status: 'AwaitingFulfillment',
        paidAt: '2026-01-02T00:00:00Z',
        totalAmount: 4990,
        currency: 'ARS',
        items: [{ productName: 'Robux', variantName: '800 R$', quantity: 1, assignedKeys: 0, revealedKeys: 0 }],
      },
      {
        id: 'order-keys-assigned',
        status: 'KeysAssigned',
        paidAt: '2026-01-03T00:00:00Z',
        totalAmount: 2990,
        currency: 'ARS',
        items: [{ productName: 'Robux', variantName: '400 R$', quantity: 1, assignedKeys: 1, revealedKeys: 0 }],
      },
      {
        id: 'order-cancelled',
        status: 'Cancelled',
        totalAmount: 1990,
        currency: 'ARS',
        items: [{ productName: 'Robux', variantName: '200 R$', quantity: 1, assignedKeys: 0, revealedKeys: 0 }],
      },
    ],
  },
])

const loadMock = vi.fn(async () => {})
const assignKeysMock = vi.fn(async () => true)
const deliverOrderMock = vi.fn(async () => true)

mockNuxtImport('useAdminBuyers', () => () => ({
  buyers,
  total: ref(1),
  page: ref(1),
  pageSize: ref(20),
  status: ref('success'),
  error: ref(null),
  load: loadMock,
  search: vi.fn(async () => {}),
  goToPage: vi.fn(async () => {}),
  resending: reactive({}),
  resendError: reactive({}),
  resendSuccess: reactive({}),
  resendDelivery: vi.fn(async () => true),
  assigning: reactive({}),
  assignError: reactive({}),
  assignSuccess: reactive({}),
  assignIncomplete: reactive({}),
  assignKeys: assignKeysMock,
  applyAssignResult: vi.fn(),
  delivering: reactive({}),
  deliverError: reactive({}),
  deliverSuccess: reactive({}),
  deliverOrder: deliverOrderMock,
}))

const orderDetailLoad = vi.fn(async () => {})
const orderDetailReset = vi.fn()
mockNuxtImport('useAdminOrderDetail', () => () => ({
  detail: ref(null),
  status: ref('pending'),
  error: ref(null),
  load: orderDetailLoad,
  reset: orderDetailReset,
  attaching: reactive({}),
  attachKey: vi.fn(async () => null),
}))

describe('pages/admin/buyers', () => {
  beforeEach(() => {
    clearNuxtState()
    assignKeysMock.mockClear()
    deliverOrderMock.mockClear()
    orderDetailLoad.mockClear()
    orderDetailReset.mockClear()
  })

  it('renders a table with one row per order, showing per-item assigned/quantity, never a key code', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.findAll('tbody tr')).toHaveLength(4)
    expect(wrapper.text()).toContain('buyer@example.com')
    expect(wrapper.text()).toContain('Riot Points × 1')
    expect(wrapper.text()).toContain('1/1')
    expect(wrapper.text()).toContain('0/1')
  })

  it('renders order status as a mapped badge label, not the raw status', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    expect(wrapper.text()).toContain('Entregado')
    expect(wrapper.text()).toContain('Preparando entrega')
    expect(wrapper.text()).toContain('Claves asignadas')
    expect(wrapper.text()).toContain('Cancelado')
    expect(wrapper.text()).not.toContain('AwaitingFulfillment')
  })

  it('shows resend only on Delivered orders, disabled until the feature ships', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    const resendButtons = wrapper.findAll('button').filter((b) => b.text() === 'Reenviar email')
    expect(resendButtons).toHaveLength(1)
    expect(resendButtons[0]!.attributes('disabled')).toBeDefined()
  })

  it('opens the order detail modal when a row is clicked, but not from its action buttons', async () => {
    const wrapper = await mountSuspended(BuyersPage, { attachTo: document.body })

    await wrapper.findAll('button').find((b) => b.text() === 'Asignar keys')?.trigger('click')
    expect(orderDetailLoad).not.toHaveBeenCalled()
    expect(document.querySelector('[aria-labelledby="order-detail-title"]')).toBeNull()

    await wrapper.findAll('tbody tr')[0]!.trigger('click')
    expect(orderDetailLoad).toHaveBeenCalledWith('order-delivered', expect.objectContaining({ email: 'buyer@example.com' }))
    const dialog = document.querySelector('[aria-labelledby="order-detail-title"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.textContent).toContain('order-de')

    dialog?.querySelector<HTMLButtonElement>('button[aria-label="Cerrar"]')?.click()
    await flushPromises()
    expect(orderDetailReset).toHaveBeenCalled()
    expect(document.querySelector('[aria-labelledby="order-detail-title"]')).toBeNull()
    wrapper.unmount()
  })

  it('offers "Asignar keys" only while keys are still pending (Paid / AwaitingFulfillment)', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    const assignButtons = wrapper.findAll('button').filter((b) => b.text() === 'Asignar keys')
    // order-pending (AwaitingFulfillment) only — once KeysAssigned the assign button gives way to Entregar
    expect(assignButtons).toHaveLength(1)
  })

  it('offers "Entregar" only when the order is KeysAssigned', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    const deliverButtons = wrapper.findAll('button').filter((b) => b.text() === 'Entregar')
    expect(deliverButtons).toHaveLength(1)
  })

  it('gives assign and deliver visually distinct button colours', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    const assignButton = wrapper.findAll('button').find((b) => b.text() === 'Asignar keys')
    const deliverButton = wrapper.findAll('button').find((b) => b.text() === 'Entregar')
    expect(assignButton?.classes().join(' ')).toContain('bg-accent')
    expect(deliverButton?.classes().join(' ')).toContain('bg-success')
  })

  it('assigns keys on a single click, without a confirmation step', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    await wrapper.findAll('button').find((b) => b.text() === 'Asignar keys')?.trigger('click')
    expect(assignKeysMock).toHaveBeenCalledWith('order-pending')
  })

  it('opens a confirmation modal for "Entregar" and only delivers once confirmed', async () => {
    // Teleport renders the modal onto document.body, outside the mounted wrapper's own tree.
    const wrapper = await mountSuspended(BuyersPage, { attachTo: document.body })

    await wrapper.findAll('button').find((b) => b.text() === 'Entregar')?.trigger('click')
    expect(deliverOrderMock).not.toHaveBeenCalled()

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.textContent).toContain('Confirmar entrega')
    expect(dialog?.textContent).toContain('buyer@example.com')
    expect(dialog?.textContent).toContain('Robux')

    const confirm = Array.from(dialog!.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.trim() === 'Entregar')
    confirm?.click()
    await flushPromises()

    expect(deliverOrderMock).toHaveBeenCalledWith('order-keys-assigned')
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    wrapper.unmount()
  })

  it('never renders action feedback inline — errors and stock warnings are toasts, not table content', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    // Any inline alert/badge here would widen the whitespace-nowrap actions cell and force the
    // overflow-x-auto table wrapper into horizontal scroll (see BuyerOrderRow.vue).
    expect(wrapper.find('tbody [role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Sin stock')
  })
})
