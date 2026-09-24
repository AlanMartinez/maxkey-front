import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WithdrawalPage from '~/pages/arrepentimiento.vue'
import { SUPPORT_EMAIL, WHATSAPP_NUMBER } from '~/utils/contact'

describe('pages/arrepentimiento', () => {
  it('renders the title, the legal basis and the link to the refund policy', async () => {
    const wrapper = await mountSuspended(WithdrawalPage)

    expect(wrapper.find('h1').text()).toBe('Botón de arrepentimiento')
    expect(wrapper.text()).toContain('Ley 24.240')
    expect(wrapper.text()).toContain('10 días corridos')
    expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toContain('/reembolsos')
  })

  it('builds the WhatsApp and mailto links from the order id and email typed by the buyer', async () => {
    const wrapper = await mountSuspended(WithdrawalPage)
    const whatsapp = wrapper.find('[data-testid="withdrawal-whatsapp"]')
    const mail = wrapper.find('[data-testid="withdrawal-email"]')

    // Nothing to send yet: the actions stay disabled instead of opening an empty message.
    expect(whatsapp.attributes('aria-disabled')).toBe('true')
    expect(whatsapp.attributes('href')).toBeUndefined()

    await wrapper.find('input[name="orderId"]').setValue('ORD-12345')
    await wrapper.find('input[name="email"]').setValue('buyer@example.com')

    const href = whatsapp.attributes('href') ?? ''
    expect(href.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`)).toBe(true)
    expect(decodeURIComponent(href)).toContain('Orden ORD-12345, email buyer@example.com')
    expect(whatsapp.attributes('aria-disabled')).toBe('false')
    expect(mail.attributes('href')?.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`)).toBe(true)
    expect(decodeURIComponent(mail.attributes('href') ?? '')).toContain('ORD-12345')
  })
})
