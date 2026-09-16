import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProductEditor from '~/components/admin/ProductEditor.vue'
import type { AdminProduct } from '~/types/api'

const product: AdminProduct = {
  id: 'p1',
  slug: 'roblox-100',
  name: 'Roblox - 100 Robux',
  platform: 'Cross-platform',
  isActive: true,
  imageKey: 'products/robux.png',
  imageUrl: 'https://cdn/robux.png',
  detailImageKey: undefined,
  detailImageUrl: undefined,
  description: 'desc',
  variants: [
    { id: 'v1', region: 'AR', edition: 'Standard', price: 9500, oldPrice: undefined, discountPercentage: undefined, currency: 'ARS', sortOrder: 0, isActive: true },
    { id: 'v2', region: 'AR', edition: 'Promo', price: 8000, oldPrice: 10000, discountPercentage: 20, currency: 'ARS', sortOrder: 1, isActive: true },
  ],
}

describe('ProductEditor', () => {
  it('renders collapsed with a thumbnail, summary, and no form fields', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })

    expect(wrapper.find('img').attributes('src')).toBe('https://cdn/robux.png')
    expect(wrapper.text()).toContain('Roblox - 100 Robux')
    expect(wrapper.text()).toContain('2 variante(s)')
    expect(wrapper.find('input[type="text"]').exists()).toBe(false)
  })

  it('expands to show editable fields on click', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })

    await wrapper.find('button').trigger('click')

    expect((wrapper.find('input[required]').element as HTMLInputElement).value).toBe('Roblox - 100 Robux')
    expect(wrapper.text()).toContain('Guardar producto')
  })

  it('only shows the discount badge on the variant that actually has one', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    expect(wrapper.text().match(/-\d+%/g)).toEqual(['-20%'])
  })
})
