import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearNuxtState } from '#app'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useNotifications } from '~/composables/useNotifications'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)

const notification = {
  id: 'notification-1',
  type: 'OrderDelivered',
  orderId: 'order-1',
  createdAt: '2026-09-21T12:00:00Z',
  readAt: null,
}

beforeEach(() => {
  clearNuxtState()
  apiMock.mockReset()
})

describe('useNotifications', () => {
  it('loads unread account notifications and exposes their count', async () => {
    apiMock.mockResolvedValue([notification])
    const notifications = useNotifications()

    await notifications.load()

    expect(apiMock).toHaveBeenCalledWith('/me/notifications')
    expect(notifications.items.value).toEqual([notification])
    expect(notifications.unreadCount.value).toBe(1)
  })

  it('marks a notification read and removes it from pending items', async () => {
    apiMock.mockResolvedValueOnce([notification]).mockResolvedValueOnce(undefined)
    const notifications = useNotifications()
    await notifications.load()

    await notifications.markRead('notification-1')

    expect(apiMock).toHaveBeenLastCalledWith('/me/notifications/notification-1/read', { method: 'POST' })
    expect(notifications.items.value).toEqual([])
    expect(notifications.unreadCount.value).toBe(0)
  })
})
