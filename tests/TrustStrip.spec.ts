import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TrustStrip from '~/components/catalog/TrustStrip.vue'
import { DELIVERY, SECURE_PAYMENT, VERIFIED_KEYS } from '~/utils/promises'

describe('TrustStrip', () => {
  it('lists the three centered guarantees from the shared promises without payment badges', async () => {
    const wrapper = await mountSuspended(TrustStrip)

    const text = wrapper.text()
    for (const label of [DELIVERY.short, VERIFIED_KEYS.short, SECURE_PAYMENT.short]) expect(text).toContain(label)
    for (const stale of ['Entrega instantánea', '100%']) expect(text).not.toContain(stale)
    expect(wrapper.find('[aria-label="Medios de pago"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Garantías"]').classes()).toContain('justify-center')
    expect(wrapper.findAll('svg')).toHaveLength(3)
  })

  it('links the verified-keys promise to the refund policy that backs it', async () => {
    const wrapper = await mountSuspended(TrustStrip)

    const link = wrapper.findAll('a').find((a) => a.text() === VERIFIED_KEYS.short)
    expect(link?.attributes('href')).toBe('/reembolsos')
  })
})
