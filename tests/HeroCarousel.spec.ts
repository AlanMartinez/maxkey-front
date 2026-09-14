import { describe, expect, it, vi } from 'vitest'
import type { DOMWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import HeroCarousel from '~/components/catalog/HeroCarousel.vue'
import type { CarouselSlideDto } from '~/types/api'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)

const slides: CarouselSlideDto[] = [
  { id: 's1', title: 'Riot Points con 90% de descuento', imageUrl: '/images/promos/riot.png', productSlug: 'riot-points', sortOrder: 0 },
  { id: 's2', title: 'Robux con 75% de descuento', imageUrl: '/images/promos/robux.png', productSlug: 'robux', sortOrder: 1 },
  { id: 's3', title: 'GTA V con 50% de descuento', imageUrl: '/images/promos/gta.png', productSlug: 'gta-v', sortOrder: 2 },
]

function activeIndex(wrapper: { findAll: (selector: string) => DOMWrapper<Element>[] }) {
  return wrapper.findAll('[role="tab"]').findIndex((tab) => tab.attributes('aria-selected') === 'true')
}

describe('HeroCarousel', () => {
  it('fetches the public carousel and fills the frame with the active slide', async () => {
    apiMock.mockResolvedValue(slides)
    const wrapper = await mountSuspended(HeroCarousel)

    expect(apiMock).toHaveBeenCalledWith('/catalog/carousel')
    expect(wrapper.find('section').classes()).toEqual(expect.arrayContaining(['overflow-hidden', 'rounded-3xl', 'aspect-[2172/724]']))
    expect(wrapper.find('img').attributes('src')).toBe('/images/promos/riot.png')
    expect(wrapper.find('img').classes()).toContain('object-cover')
    expect(wrapper.find('[role="tablist"]').classes()).toContain('absolute')
    expect(activeIndex(wrapper)).toBe(0)
  })

  it('moves with the arrow buttons, wrapping around, and with the keyboard', async () => {
    apiMock.mockResolvedValue(slides)
    const wrapper = await mountSuspended(HeroCarousel)

    await wrapper.find('button[aria-label="Oferta anterior"]').trigger('click')
    expect(activeIndex(wrapper)).toBe(2)

    await wrapper.find('button[aria-label="Oferta siguiente"]').trigger('click')
    expect(activeIndex(wrapper)).toBe(0)

    await wrapper.find('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' })
    expect(activeIndex(wrapper)).toBe(1)

    await wrapper.findAll('[role="tab"]')[2]?.trigger('click')
    expect(activeIndex(wrapper)).toBe(2)
  })

  it('renders nothing when the carousel is empty', async () => {
    apiMock.mockResolvedValue([])
    const wrapper = await mountSuspended(HeroCarousel)

    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('renders nothing on a fetch error instead of stale static slides', async () => {
    apiMock.mockRejectedValue(new Error('network down'))
    const wrapper = await mountSuspended(HeroCarousel)

    expect(wrapper.find('section').exists()).toBe(false)
  })
})
