import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import VariantSelector from '~/components/product/VariantSelector.vue'

const variants = [
  { id: 'v1', name: '1.750 RP', region: 'LAS', price: 9990, currency: 'ARS' },
  { id: 'v2', name: '3.500 RP', region: 'LAS', price: 18500, oldPrice: 21000, currency: 'ARS' },
  { id: 'v3', name: '1.750 RP', region: 'NA', price: 9990, currency: 'ARS', isActive: false },
  { id: 'v4', name: '3.500 RP', region: 'NA', price: 18900, currency: 'ARS' },
]

function mountSelector(modelValue: string | null = 'v1', extra: Record<string, unknown> = {}) {
  return mount(VariantSelector, { props: { variants, modelValue, ...extra } })
}
const regionChips = (wrapper: ReturnType<typeof mountSelector>) => wrapper.findAll('[aria-label="Elegí tu región"] button')
const amountRows = (wrapper: ReturnType<typeof mountSelector>) => wrapper.findAll('[aria-label="Elegí el monto"] button')

describe('VariantSelector', () => {
  it('shows region chips and only the amounts of the selected region', () => {
    const wrapper = mountSelector()

    expect(regionChips(wrapper).map((b) => b.text())).toEqual(['LAS', 'NA'])
    expect(regionChips(wrapper)[0]?.attributes('aria-pressed')).toBe('true')
    expect(amountRows(wrapper)).toHaveLength(2)
    expect(amountRows(wrapper)[0]?.attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain('3.500 RP')
    expect(wrapper.text()).toContain('18.500')
    expect(wrapper.text()).toContain('21.000')
  })

  it('omits the region chips when no variant exposes a region', () => {
    const wrapper = mount(VariantSelector, { props: { variants: [{ id: 'a', name: '10 USD', price: 100, currency: 'USD' }], modelValue: 'a' } })

    expect(wrapper.text()).not.toContain('Elegí tu región')
    expect(amountRows(wrapper)).toHaveLength(1)
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

  it('switching region selects its first active variant', async () => {
    const wrapper = mountSelector()

    await regionChips(wrapper)[1]?.trigger('click')

    expect(regionChips(wrapper)[1]?.attributes('aria-pressed')).toBe('true')
    expect(amountRows(wrapper).map((b) => b.text())).toEqual(expect.arrayContaining([expect.stringContaining('18.900')]))
    expect(wrapper.emitted('update:modelValue')).toEqual([['v4']])
  })

  it('ignores clicks on inactive variants', async () => {
    const wrapper = mountSelector('v4')
    const inactive = amountRows(wrapper)[0]

    expect(inactive?.attributes('disabled')).toBeDefined()
    await inactive?.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
