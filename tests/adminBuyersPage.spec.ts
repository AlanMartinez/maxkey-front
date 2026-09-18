import { describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
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
  assignKeys: vi.fn(async () => true),
  delivering: reactive({}),
  deliverError: reactive({}),
  deliverSuccess: reactive({}),
  deliverOrder: vi.fn(async () => true),
}))

describe('pages/admin/buyers', () => {
  it('groups orders under the buyer and shows assigned/revealed-key counts, never a key code', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    expect(wrapper.text()).toContain('buyer@example.com')
    expect(wrapper.text()).toContain('Riot Points')
    expect(wrapper.text()).toContain('Robux')
    expect(wrapper.text()).toContain('1 clave(s) asignada(s), 1 revelada(s)')
    expect(wrapper.text()).toContain('0 clave(s) asignada(s), 0 revelada(s)')
  })

  it('offers resend only on Delivered orders (key-delivery-gate PR #49)', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    const resendButtons = wrapper.findAll('button').filter((b) => b.text().includes('Reenviar email de entrega'))
    expect(resendButtons).toHaveLength(1)
  })

  it('offers "Asignar" on every order except Delivered and Cancelled', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    const assignButtons = wrapper.findAll('button').filter((b) => b.text() === 'Asignar')
    // order-pending (AwaitingFulfillment) + order-keys-assigned (KeysAssigned) — not order-delivered, not order-cancelled
    expect(assignButtons).toHaveLength(2)
  })

  it('offers "Entregar" only when the order is KeysAssigned', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    const deliverButtons = wrapper.findAll('button').filter((b) => b.text() === 'Entregar')
    expect(deliverButtons).toHaveLength(1)
  })
})
