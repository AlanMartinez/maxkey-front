import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProductCard from '~/components/catalog/ProductCard.vue'

const product = { id: 'p1', slug: 'riot-points', name: 'Riot Points', platform: 'Riot Games', imageUrl: 'https://cdn/x.png', fromPrice: 9990, oldPrice: 11350 }

describe('ProductCard', () => {
  it('links to the product page and shows platform, price and discount', async () => {
    const wrapper = await mountSuspended(ProductCard, { props: { product } })

    expect(wrapper.find('a').attributes('href')).toBe('/product/riot-points')
    expect(wrapper.text()).toContain('Riot Games')
    expect(wrapper.text()).toContain('9.990')
    expect(wrapper.text()).toContain('-12%')
  })

  it('hides the discount badge without an old price', async () => {
    const wrapper = await mountSuspended(ProductCard, { props: { product: { ...product, oldPrice: undefined } } })

    expect(wrapper.text()).not.toContain('%')
  })
})
