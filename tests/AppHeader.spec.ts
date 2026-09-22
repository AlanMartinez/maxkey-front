import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { clearNuxtState } from '#app'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import AppHeader from '~/components/layout/AppHeader.vue'

const { load, markRead } = vi.hoisted(() => ({ load: vi.fn(), markRead: vi.fn() }))
const isAuthenticated = ref(true)
const items = ref([{ id: 'notification-1', type: 'OrderDelivered' as const, orderId: 'order-1', createdAt: '2026-09-21T12:00:00Z', readAt: null }])

mockNuxtImport('useCart', () => () => ({ count: ref(0), toggle: vi.fn() }))
mockNuxtImport('useAuth', () => () => ({ isAuthenticated, isAdmin: ref(false), displayName: ref('Buyer One'), openLogin: vi.fn(), signOut: vi.fn() }))
mockNuxtImport('useNotifications', () => () => ({ items, unreadCount: computed(() => items.value.length), load, markRead }))

beforeEach(() => {
  clearNuxtState()
  isAuthenticated.value = true
  items.value = [{ id: 'notification-1', type: 'OrderDelivered', orderId: 'order-1', createdAt: '2026-09-21T12:00:00Z', readAt: null }]
  load.mockReset()
  markRead.mockReset()
  markRead.mockResolvedValue(true)
})

describe('AppHeader notifications', () => {
  it('shows pending delivery count only for authenticated users', async () => {
    const wrapper = await mountSuspended(AppHeader)

    expect(wrapper.find('button[aria-label="Notificaciones"]').text()).toContain('1')
    expect(load).toHaveBeenCalledOnce()

    isAuthenticated.value = false
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button[aria-label="Notificaciones"]').exists()).toBe(false)
  })

  it('marks notification read before opening delivered order keys', async () => {
    const wrapper = await mountSuspended(AppHeader)
    await wrapper.find('button[aria-label="Notificaciones"]').trigger('click')
    await wrapper.find('a[href="/account/orders/order-1"]').trigger('click')

    expect(markRead).toHaveBeenCalledWith('notification-1')
  })
})
