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

  // Regression: a keyed `<template v-if>`/`<template v-else>` pair was observed in production
  // reusing the guest branch's DOM node for the authenticated branch after a live login — the
  // account dropdown ended up nested inside the stale "Iniciar sesión" wrapper instead of its own
  // trigger button, positioning it wrong. Real keyed elements (not keyed template fragments) force
  // a clean teardown/remount instead.
  it('replaces the guest markup entirely when logging in live, leaving no trace of it', async () => {
    isAuthenticated.value = false
    const wrapper = await mountSuspended(AppHeader)
    expect(wrapper.find('button[aria-label="Iniciar sesión"]').exists()).toBe(true)

    isAuthenticated.value = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[aria-label="Iniciar sesión"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Iniciar sesión')

    await wrapper.find('button[aria-expanded]:not([aria-label])').trigger('click')
    const menu = wrapper.find('div.absolute.right-0.top-full:has(button)')
    expect(menu.element.parentElement?.className).toContain('relative')
  })
})
