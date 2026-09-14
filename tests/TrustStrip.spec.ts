import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TrustStrip from '~/components/catalog/TrustStrip.vue'

describe('TrustStrip', () => {
  it('lists the three centered guarantees without payment badges', () => {
    const wrapper = mount(TrustStrip)

    const text = wrapper.text()
    for (const label of ['Entrega instantánea', 'Keys 100% verificadas', 'Pago 100% seguro']) expect(text).toContain(label)
    expect(wrapper.find('[aria-label="Medios de pago"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Garantías"]').classes()).toContain('justify-center')
    expect(wrapper.findAll('svg')).toHaveLength(3)
  })
})
