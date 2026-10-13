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

  it('hides the phone field unless the page asks for it', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { modelValue: '' } })
    expect(wrapper.find('input[type="tel"]').exists()).toBe(false)
  })

  it('validates the phone after blur and prefers the server error', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { modelValue: 'vos@ejemplo.com', askPhone: true, phone: '123' } })
    const tel = wrapper.find('input[type="tel"]')
    expect(tel.attributes('required')).toBeDefined()
    expect(wrapper.find('[data-phone-error]').exists()).toBe(false)

    await tel.trigger('blur')
    expect(wrapper.find('[data-phone-error]').text()).toContain('Ingresá un teléfono válido')

    await wrapper.setProps({ phone: '+54 11 2345-6789' })
    expect(wrapper.find('[data-phone-error]').exists()).toBe(false)
    expect(wrapper.find('[data-phone-valid]').exists()).toBe(true)

    await wrapper.setProps({ phoneError: 'El teléfono no es válido.' })
    expect(wrapper.find('[data-phone-error]').text()).toBe('El teléfono no es válido.')
  })
})
