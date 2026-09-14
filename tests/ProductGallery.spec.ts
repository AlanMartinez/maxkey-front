import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductGallery from '~/components/product/ProductGallery.vue'

describe('ProductGallery', () => {
  it('renders only the main image without thumbnails when there is a single image', () => {
    const wrapper = mount(ProductGallery, { props: { images: ['/a.png'], alt: 'Riot Points' } })

    expect(wrapper.findAll('img')).toHaveLength(1)
    expect(wrapper.find('img').attributes('src')).toBe('/a.png')
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
  })

  it('renders a thumbnail per image and swaps the main image on click', async () => {
    const wrapper = mount(ProductGallery, { props: { images: ['/a.png', '/b.png', '/c.png'], alt: 'Riot Points' } })
    const thumbs = wrapper.findAll('[role="tab"]')

    expect(thumbs).toHaveLength(3)
    expect(thumbs.map((t) => t.attributes('aria-label'))).toEqual(['Vista 1', 'Vista 2', 'Vista 3'])
    expect(thumbs[0]?.attributes('aria-selected')).toBe('true')

    await thumbs[2]?.trigger('click')

    expect(wrapper.find('img').attributes('src')).toBe('/c.png')
    expect(wrapper.findAll('[role="tab"]')[2]?.attributes('aria-selected')).toBe('true')
  })
})
