import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppFooter from '~/components/layout/AppFooter.vue'
import { SUPPORT_EMAIL, WHATSAPP_NUMBER } from '~/utils/contact'

describe('AppFooter', () => {
  it('links every help and legal page', async () => {
    const wrapper = await mountSuspended(AppFooter)

    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    for (const route of ['/como-funciona', '/ayuda', '/contacto', '/terminos', '/privacidad', '/reembolsos']) {
      expect(hrefs).toContain(route)
    }
  })

  it('exposes the support email and WhatsApp channels', async () => {
    const wrapper = await mountSuspended(AppFooter)

    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href') ?? '')
    expect(hrefs).toContain(`mailto:${SUPPORT_EMAIL}`)
    expect(hrefs.some((href) => href.startsWith(`https://wa.me/${WHATSAPP_NUMBER}`))).toBe(true)
  })
})
