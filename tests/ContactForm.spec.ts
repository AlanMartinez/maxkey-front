import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ContactForm from '~/components/checkout/ContactForm.vue'

describe('ContactForm', () => {
  it('confirms a valid email only after the field loses focus', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { modelValue: 'vos@ejemplo.com' } })
    const input = wrapper.find('input[type="email"]')

    expect(input.attributes('spellcheck')).toBe('false')
    expect(input.attributes('autocapitalize')).toBe('off')
    expect(wrapper.text()).toContain('Acá te llega la key. Revisá que esté bien escrito.')
    expect(wrapper.find('[data-valid]').exists()).toBe(false)

    await input.trigger('blur')
    expect(wrapper.find('[data-valid]').exists()).toBe(true)
    expect(input.attributes('aria-invalid')).toBe('false')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('normalises whitespace and case when the field loses focus', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { modelValue: '  Vos@Ejemplo.COM ' } })
    await wrapper.find('input[type="email"]').trigger('blur')
    expect(wrapper.emitted('update:modelValue')).toEqual([['vos@ejemplo.com']])
  })

  it('flags an invalid email after blur and hides the confirmation', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { modelValue: 'vos@' } })
    const input = wrapper.find('input[type="email"]')

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    await input.trigger('blur')
    expect(wrapper.find('[data-valid]').exists()).toBe(false)
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('[role="alert"]').text()).toBe('Ingresá un email válido.')
  })

  it('prefers the error passed by the page over the local one', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { modelValue: 'vos@ejemplo.com', error: 'Ese email no existe.' } })
    await wrapper.find('input[type="email"]').trigger('blur')
    expect(wrapper.find('[data-valid]').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').text()).toBe('Ese email no existe.')
  })

  it('emits the typed value untouched while typing', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { modelValue: '' } })
    await wrapper.find('input[type="email"]').setValue('Vos@Ejemplo.com')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Vos@Ejemplo.com']])
  })
})
