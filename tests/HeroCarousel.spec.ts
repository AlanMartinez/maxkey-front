import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { DOMWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import HeroCarousel from '~/components/catalog/HeroCarousel.vue'
import type { CarouselSlideDto } from '~/types/api'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)

const apiSlides: CarouselSlideDto[] = [
  { id: 's1', title: 'Riot Points con 90% de descuento', imageUrl: '/images/promos/riot.png', productSlug: 'riot-points', sortOrder: 0 },
  { id: 's2', title: 'Robux con 75% de descuento', imageUrl: '/images/promos/robux.png', productSlug: 'robux', sortOrder: 1 },
  { id: 's3', title: 'GTA V con 50% de descuento', imageUrl: '/images/promos/gta.png', productSlug: 'gta-v', sortOrder: 2 },
]

function activeIndex(wrapper: { findAll: (selector: string) => DOMWrapper<Element>[] }) {
  return wrapper.findAll('[role="tab"]').findIndex((tab) => tab.attributes('aria-selected') === 'true')
}

afterEach(() => {
  vi.useRealTimers()
})

describe('HeroCarousel', () => {
  it('fetches the public carousel and fills the frame with the active slide', async () => {
    apiMock.mockResolvedValue(apiSlides)
    const wrapper = await mountSuspended(HeroCarousel)

    expect(apiMock).toHaveBeenCalledWith('/catalog/carousel')
    expect(wrapper.find('section').classes()).toEqual(expect.arrayContaining(['overflow-hidden', 'rounded-3xl', 'aspect-[2172/724]']))
    expect(wrapper.find('img').attributes('src')).toBe('/images/promos/riot.png')
    expect(wrapper.find('img').classes()).toContain('object-cover')
    expect(wrapper.find('[role="tablist"]').classes()).toContain('absolute')
    expect(activeIndex(wrapper)).toBe(0)
    // Real slides link to their product page, not the catalog anchor.
    expect(wrapper.find('a').attributes('href')).toBe('/product/riot-points')
  })

  it('moves with the arrow buttons, wrapping around, and with the keyboard', async () => {
    apiMock.mockResolvedValue(apiSlides)
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

  it('pauses autoplay while hovered or focused and resumes on leave', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    apiMock.mockResolvedValue(apiSlides)
    const wrapper = await mountSuspended(HeroCarousel)
    const section = wrapper.find('section')

    vi.advanceTimersByTime(5000)
    await nextTick()
    expect(activeIndex(wrapper)).toBe(1)

    await section.trigger('mouseenter')
    vi.advanceTimersByTime(10000)
    await nextTick()
    expect(activeIndex(wrapper)).toBe(1)

    await section.trigger('mouseleave')
    vi.advanceTimersByTime(5000)
    await nextTick()
    expect(activeIndex(wrapper)).toBe(2)

    await section.trigger('focusin')
    vi.advanceTimersByTime(10000)
    await nextTick()
    expect(activeIndex(wrapper)).toBe(2)
  })

  it('renders the static fallback slides when the API returns an empty array', async () => {
    apiMock.mockResolvedValue([])
    const wrapper = await mountSuspended(HeroCarousel)

    expect(wrapper.find('section').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('/images/promos/riot-promo-text-20260913.png')
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
    // Fallback slides have no real product behind them; they link to the catalog anchor.
    expect(wrapper.find('a').attributes('href')).toBe('/#catalogo')
    // Neutral copy only: no hard-coded discount claims that the catalog prices might contradict.
    expect(wrapper.findAll('h2').map((h) => h.text())).toEqual(['Keys para tus juegos favoritos', 'Gift cards y suscripciones', 'Pagá seguro con Mercado Pago'])
    expect(wrapper.text()).not.toContain('%')
  })

  it('renders the static fallback slides when the fetch fails', async () => {
    apiMock.mockRejectedValue(new Error('network down'))
    const wrapper = await mountSuspended(HeroCarousel)

    expect(wrapper.find('section').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('/images/promos/riot-promo-text-20260913.png')
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
  })
})
