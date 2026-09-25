import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PurchasePanel from '~/components/product/PurchasePanel.vue'
import { DELIVERY, REFUND, SUPPORT } from '~/utils/promises'

const variant = { id: 'v2', name: '3.500 RP', price: 18500, oldPrice: 21000, currency: 'ARS', isRecommended: true }
const productName = 'League of Legends RP'

describe('PurchasePanel', () => {
  it('shows the price with its compare-at price, both actions and the reassurance lines', async () => {
    const wrapper = await mountSuspended(PurchasePanel, { props: { productName, variant } })

    expect(wrapper.text()).toContain(productName)
    expect(wrapper.text()).toContain('18.500')
    expect(wrapper.find('.line-through').text()).toContain('21.000')
    const buttons = wrapper.findAll('button')
    expect(buttons.map((b) => b.text())).toEqual(['Comprar ahora', 'Agregar al carrito'])
    for (const line of [DELIVERY.short, DELIVERY.detail, REFUND.short, SUPPORT.short]) expect(wrapper.text()).toContain(line)
    for (const stale of ['24h', '24/7', 'automática']) expect(wrapper.text()).not.toContain(stale)
    // Promises backed by a page link to it.
    expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toEqual(expect.arrayContaining(['/reembolsos', '/contacto']))

    await buttons[0]?.trigger('click')
    await buttons[1]?.trigger('click')
    expect(wrapper.emitted('buy')).toHaveLength(1)
    expect(wrapper.emitted('add')).toHaveLength(1)
  })

  it('disables the actions without a variant and swaps the label after adding', async () => {
    const wrapper = await mountSuspended(PurchasePanel, { props: { productName, variant: undefined } })
    expect(wrapper.findAll('button').every((b) => b.attributes('disabled') !== undefined)).toBe(true)

    await wrapper.setProps({ variant, addedLabel: true, error: 'El carrito admite hasta 20 productos distintos.' })
    expect(wrapper.findAll('button')[1]?.text()).toBe('Agregado ✓')
    expect(wrapper.find('[role="alert"]').text()).toContain('20 productos')
  })

  it('shows an orange offer badge above 50%', async () => {
    const wrapper = await mountSuspended(PurchasePanel, { props: { productName, variant: { ...variant, price: 4900, oldPrice: 10000 } } })

    expect(wrapper.findAll('[class*="bg-amber-500"]').some((element) => element.text() === '-51%')).toBe(true)
  })
})
