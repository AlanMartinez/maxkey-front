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
        items: [{ productName: 'Riot Points', variantName: '1.750 RP', quantity: 1, assignedKeys: 1 }],
      },
      {
        id: 'order-pending',
        status: 'AwaitingFulfillment',
        paidAt: '2026-01-02T00:00:00Z',
        totalAmount: 4990,
        currency: 'ARS',
        items: [{ productName: 'Robux', variantName: '800 R$', quantity: 1, assignedKeys: 0 }],
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
}))

describe('pages/admin/buyers', () => {
  it('groups orders under the buyer, shows only assigned-key counts, and offers resend only on Delivered orders', async () => {
    const wrapper = await mountSuspended(BuyersPage)

    expect(wrapper.text()).toContain('buyer@example.com')
    expect(wrapper.text()).toContain('Riot Points')
    expect(wrapper.text()).toContain('Robux')
    expect(wrapper.text()).toContain('1 clave(s) asignada(s)')
    expect(wrapper.text()).toContain('0 clave(s) asignada(s)')

    const resendButtons = wrapper.findAll('button').filter((b) => b.text().includes('Reenviar email de entrega'))
    expect(resendButtons).toHaveLength(1)
  })
})
