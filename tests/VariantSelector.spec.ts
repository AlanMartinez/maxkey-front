import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import VariantSelector from '~/components/product/VariantSelector.vue'

const variants = [
  { id: 'v1', name: '1.750 RP', region: 'LAS', price: 9990, currency: 'ARS' },
  { id: 'v2', name: '3.500 RP', region: 'LAS', price: 18500, oldPrice: 21000, currency: 'ARS' },
  { id: 'v3', name: '1.750 RP', region: 'NA', price: 9990, currency: 'ARS', isActive: false },
]

function mountSelector(modelValue: string | null = 'v1') {
  return mount(VariantSelector, { props: { variants, modelValue } })
}

describe('VariantSelector', () => {
  it('renders every variant grouped by region with its price', () => {
    const wrapper = mountSelector()

    expect(wrapper.findAll('button')).toHaveLength(3)
    expect(wrapper.findAll('legend').map((l) => l.text())).toEqual(['LAS', 'NA'])
    expect(wrapper.text()).toContain('3.500 RP')
    expect(wrapper.text()).toContain('18.500')
    expect(wrapper.findAll('button')[0]?.attributes('aria-pressed')).toBe('true')
  })

  it('emits update:modelValue and select with the variant on click', async () => {
    const wrapper = mountSelector()

    await wrapper.findAll('button')[1]?.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['v2']])
    expect(wrapper.emitted('select')).toEqual([[variants[1]]])
  })

  it('ignores clicks on inactive variants', async () => {
    const wrapper = mountSelector()
    const inactive = wrapper.findAll('button')[2]

    expect(inactive?.attributes('disabled')).toBeDefined()
    await inactive?.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
