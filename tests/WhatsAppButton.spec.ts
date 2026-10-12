import { afterEach, describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import WhatsAppButton from '~/components/layout/WhatsAppButton.vue'
import { WHATSAPP_NUMBER } from '~/utils/contact'

// Mocked instead of navigating: hitting /admin for real would run the admin route middleware.
const route = reactive({ path: '/' })
mockNuxtImport('useRoute', () => () => route)

afterEach(() => {
  route.path = '/'
})

describe('WhatsAppButton', () => {
  it('links to the configured WhatsApp number in a new tab', async () => {
    const wrapper = await mountSuspended(WhatsAppButton)

    const link = wrapper.find('[data-testid="whatsapp-button"]')
    expect(link.attributes('href')).toMatch(new RegExp(`^https://wa\\.me/${WHATSAPP_NUMBER}`))
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener')
    expect(link.attributes('aria-label')).toBeTruthy()
  })

  it('is hidden on admin screens', async () => {
    route.path = '/admin/catalog'
    const wrapper = await mountSuspended(WhatsAppButton)

    expect(wrapper.find('[data-testid="whatsapp-button"]').exists()).toBe(false)
  })

  it('sits above the mobile purchase bar on product pages', async () => {
    route.path = '/product/roblox-1000'
    const wrapper = await mountSuspended(WhatsAppButton)

    expect(wrapper.find('[data-testid="whatsapp-button"]').classes()).toContain('bottom-24')
  })
})
