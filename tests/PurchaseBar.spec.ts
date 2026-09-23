import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PurchaseBar from '~/components/product/PurchaseBar.vue'

const variant = { id: 'v2', name: '3.500 RP', price: 18500, oldPrice: 21000, currency: 'ARS', isRecommended: true }

describe('PurchaseBar', () => {
  it('shows the selected variant with its prices and emits both actions', async () => {
    const wrapper = await mountSuspended(PurchaseBar, { props: { variant } })

    expect(wrapper.text()).toContain('3.500 RP')
    expect(wrapper.text()).toContain('18.500')
    expect(wrapper.find('.line-through').text()).toContain('21.000')
    // Mobile-only: hidden on desktop where PurchasePanel takes over.
    expect(wrapper.find('section').classes()).toContain('lg:hidden')

    const [add, buy] = wrapper.findAll('button')
    expect(add?.attributes('aria-label')).toBe('Agregar al carrito')
    expect(buy?.text()).toBe('Comprar ahora')
    await add?.trigger('click')
    await buy?.trigger('click')
    expect(wrapper.emitted('add')).toHaveLength(1)
    expect(wrapper.emitted('buy')).toHaveLength(1)
  })

  it('lets the buyer switch variants from the bar and marks the selected one', async () => {
    const other = { id: 'v1', name: '1.750 RP', price: 9990, currency: 'ARS', isRecommended: false }
    const wrapper = await mountSuspended(PurchaseBar, { props: { variants: [other, variant], modelValue: 'v2', recommendedId: 'v2', variant } })

    const chips = wrapper.findAll('[role="group"] button')
    expect(chips.map((c) => c.attributes('aria-pressed'))).toEqual(['false', 'true'])
    expect(chips[1]?.text()).toContain('Más elegido')

    await chips[0]?.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['v1']])
  })

  it('hides the chip row with a single variant', async () => {
    const wrapper = await mountSuspended(PurchaseBar, { props: { variants: [variant], modelValue: 'v2', variant } })
    expect(wrapper.find('[role="group"]').exists()).toBe(false)
  })

  it('disables the actions without a variant and reflects the added state and errors', async () => {
    const wrapper = await mountSuspended(PurchaseBar, { props: { variant: undefined } })
    expect(wrapper.findAll('button').every((b) => b.attributes('disabled') !== undefined)).toBe(true)

    await wrapper.setProps({ variant, addedLabel: true, error: 'El carrito admite hasta 20 productos distintos.' })
    expect(wrapper.findAll('button')[0]?.attributes('aria-label')).toBe('Agregado')
    expect(wrapper.find('[role="alert"]').text()).toContain('20 productos')
  })

  it('shows an orange offer badge above 50%', async () => {
    const wrapper = await mountSuspended(PurchaseBar, { props: { variant: { ...variant, price: 4900, oldPrice: 10000 } } })

    expect(wrapper.findAll('[class*="bg-amber-500"]').some((element) => element.text() === '-51%')).toBe(true)
  })
})
