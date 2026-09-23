import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import VariantSelector from '~/components/product/VariantSelector.vue'

const variants = [
  { id: 'v1', name: '1.750 RP', region: 'LAS', price: 9990, currency: 'ARS', isRecommended: false },
  { id: 'v2', name: '3.500 RP', region: 'LAS', price: 18500, oldPrice: 21000, currency: 'ARS', isRecommended: true },
  { id: 'v3', name: '1.750 RP', region: 'NA', price: 9990, currency: 'ARS', isActive: false, isRecommended: false },
  { id: 'v4', name: '3.500 RP', region: 'NA', price: 18900, currency: 'ARS', isRecommended: false },
]

function mountSelector(modelValue: string | null = 'v1', extra: Record<string, unknown> = {}) {
  return mount(VariantSelector, { props: { variants, modelValue, ...extra } })
}
const amountRows = (wrapper: ReturnType<typeof mountSelector>) => wrapper.findAll('[aria-label="Elegí el monto"] button')

describe('VariantSelector', () => {
  it('shows every variant as an amount row, regardless of region', () => {
    const wrapper = mountSelector()

    expect(amountRows(wrapper)).toHaveLength(4)
    expect(amountRows(wrapper)[0]?.attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain('3.500 RP')
    expect(wrapper.text()).toContain('18.500')
    expect(wrapper.text()).toContain('21.000')
  })

  it('shows the discount badge only on variants with an old price', () => {
    const wrapper = mountSelector()

    expect(amountRows(wrapper)[1]?.text()).toContain('-12%')
    expect(amountRows(wrapper)[0]?.text()).not.toContain('%')
  })

  it('shows an orange offer badge above 50%', () => {
    const offer = { ...variants[1], price: 4900, oldPrice: 10000 }
    const wrapper = mount(VariantSelector, { props: { variants: [offer], modelValue: offer.id } })

    expect(wrapper.findAll('[class*="bg-amber-500"]').some((element) => element.text() === '-51%')).toBe(true)
  })

  it('tags the recommended variant with "Más elegido"', () => {
    const wrapper = mountSelector('v1', { recommendedId: 'v2' })

    expect(amountRows(wrapper)[1]?.text()).toContain('Más elegido')
    expect(amountRows(wrapper)[0]?.text()).not.toContain('Más elegido')
  })

  it('emits update:modelValue and select with the variant on click', async () => {
    const wrapper = mountSelector()

    await amountRows(wrapper)[1]?.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['v2']])
    expect(wrapper.emitted('select')).toEqual([[variants[1]]])
  })

  it('ignores clicks on inactive variants', async () => {
    const wrapper = mountSelector('v4')
    const inactive = amountRows(wrapper)[2]

    expect(inactive?.attributes('disabled')).toBeDefined()
    await inactive?.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
