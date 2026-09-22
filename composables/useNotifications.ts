import type { AccountNotificationDto } from '~/types/api'

/** Pending notifications belong to authenticated account; backend remains source of truth across devices. */
export function useNotifications() {
  const items = useState<AccountNotificationDto[]>('account-notifications', () => [])
  const loading = useState('account-notifications-loading', () => false)
  const loaded = useState('account-notifications-loaded', () => false)
  const unreadCount = computed(() => items.value.length)

  async function load() {
    if (loading.value) return
    loading.value = true
    try {
      items.value = await useApi()<AccountNotificationDto[]>('/me/notifications')
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function markRead(notificationId: string) {
    const notification = items.value.find((item) => item.id === notificationId)
    if (!notification) return false

    items.value = items.value.filter((item) => item.id !== notificationId)
    try {
      await useApi()(`/me/notifications/${notificationId}/read`, { method: 'POST' })
      return true
    } catch (error) {
      items.value = [...items.value, notification]
      throw error
    }
  }

  return { items, loading, loaded, unreadCount, load, markRead }
}
