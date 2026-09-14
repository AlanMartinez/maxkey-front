import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PaymentMethodSelector from '~/components/checkout/PaymentMethodSelector.vue'

describe('PaymentMethodSelector', () => {
  it('renders Mercado Pago as a required radio card, checked when selected', async () => {
    const wrapper = await mountSuspended(PaymentMethodSelector, { props: { modelValue: 'mercadopago' } })
    const radio = wrapper.find<HTMLInputElement>('input[type="radio"]')

    expect(wrapper.text()).toContain('Método de pago')
    expect(wrapper.text()).toContain('Mercado Pago')
    expect(wrapper.text()).toContain('Tarjetas, dinero en cuenta y más')
    expect(radio.element.checked).toBe(true)
    expect(radio.attributes('required')).toBeDefined()
  })

  it('emits the chosen method and honours the disabled flag', async () => {
    const wrapper = await mountSuspended(PaymentMethodSelector, { props: { modelValue: null } })
    const radio = wrapper.find<HTMLInputElement>('input[type="radio"]')

    expect(radio.element.checked).toBe(false)
    await radio.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toEqual([['mercadopago']])

    await wrapper.setProps({ disabled: true })
    expect(wrapper.find('input[type="radio"]').attributes('disabled')).toBeDefined()
  })
})
