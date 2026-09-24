import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppFooter from '~/components/layout/AppFooter.vue'
import { BUSINESS, CONSUMER_DEFENSE_URL } from '~/utils/business'
import { SUPPORT_EMAIL, WHATSAPP_NUMBER } from '~/utils/contact'

const emptyBusiness = { ...BUSINESS }

afterEach(() => {
  Object.assign(BUSINESS, emptyBusiness)
})

describe('AppFooter', () => {
  it('links every help and legal page, including the withdrawal button and Defensa del Consumidor', async () => {
    const wrapper = await mountSuspended(AppFooter)

    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    for (const route of ['/como-funciona', '/ayuda', '/contacto', '/terminos', '/privacidad', '/reembolsos', '/arrepentimiento']) {
      expect(hrefs).toContain(route)
    }
    const consumerDefense = wrapper.findAll('a').find((a) => a.attributes('href') === CONSUMER_DEFENSE_URL)
    expect(consumerDefense?.attributes('rel')).toBe('noopener')
    expect(consumerDefense?.attributes('target')).toBe('_blank')
  })

  it('exposes the support email and WhatsApp channels', async () => {
    const wrapper = await mountSuspended(AppFooter)

    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href') ?? '')
    expect(hrefs).toContain(`mailto:${SUPPORT_EMAIL}`)
    expect(hrefs.some((href) => href.startsWith(`https://wa.me/${WHATSAPP_NUMBER}`))).toBe(true)
  })

  it('hides the legal identity row while the business data is not configured', async () => {
    const wrapper = await mountSuspended(AppFooter)

    expect(wrapper.find('[data-testid="footer-identity"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('CUIT')
  })

  it('renders the identity row with the AFIP link once the business data is set', async () => {
    Object.assign(BUSINESS, { legalName: 'Chekeys S.A.S.', cuit: '30-12345678-9', address: 'Av. Siempre Viva 742, CABA', dataFiscalUrl: 'https://afip.example/qr' })
    const wrapper = await mountSuspended(AppFooter)

    const row = wrapper.find('[data-testid="footer-identity"]')
    expect(row.text()).toContain('Chekeys S.A.S. · CUIT 30-12345678-9 · Av. Siempre Viva 742, CABA')
    expect(row.find('a').attributes('href')).toBe('https://afip.example/qr')
  })
})
