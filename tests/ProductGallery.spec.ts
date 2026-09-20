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

  it('excludes the main image from thumbnails and opens the matching gallery image', async () => {
    const wrapper = mount(ProductGallery, {
      props: {
        images: ['/a.png', '/b.png', '/c.png', '/d.png', '/e.png', '/f.png'],
        alt: 'Riot Points',
      },
      global: { stubs: { Teleport: true } },
    })
    const thumbnails = wrapper.findAll('button').filter((button) => button.find('img').exists())

    expect(thumbnails.map((thumbnail) => thumbnail.find('img').attributes('src'))).toEqual(['/b.png', '/c.png', '/d.png'])
    expect(thumbnails[2]?.text()).toContain('+2')

    await thumbnails[2]?.trigger('click')

    const dots = wrapper.findAll('.absolute.bottom-4 span')
    expect(dots).toHaveLength(6)
    expect(dots[3]?.classes()).toContain('bg-white')
  })
})
