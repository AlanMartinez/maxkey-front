import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TrustStrip from '~/components/catalog/TrustStrip.vue'

describe('TrustStrip', () => {
  it('lists the three guarantees and the payment badges', () => {
    const wrapper = mount(TrustStrip)

    const text = wrapper.text()
    for (const label of ['Entrega instantánea', 'Keys 100% verificadas', 'Pago 100% seguro']) expect(text).toContain(label)
    expect(wrapper.findAll('[aria-label="Medios de pago"] li').map((li) => li.text())).toEqual(['VISA', 'MASTERCARD', 'MERCADO PAGO', 'PAYPAL'])
    expect(wrapper.findAll('svg')).toHaveLength(3)
  })
})
