import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import RecommendedCarousel from '~/components/catalog/RecommendedCarousel.vue'
import type { ProductSummary } from '~/types/api'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)
mockNuxtImport('useSupabaseClient', () => () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }))

function product(slug: string, platform = 'Steam'): ProductSummary {
  return { id: slug, slug, name: slug, platform, imageUrl: 'https://cdn/x.png', fromPrice: 1000 }
}

// jsdom never lays elements out, so `offsetLeft` is always 0 — the carousel measures the card step
// from it, so without this every transform in the test would collapse to `translateX(-0px)` and the
// exact bug under test (an out-of-range starting position) would be invisible to the assertions.
const CARD_STEP = 100
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
    configurable: true,
    get(this: HTMLElement) {
      const parent = this.parentElement
      if (!parent) return 0
      return Array.prototype.indexOf.call(parent.children, this) * CARD_STEP
    },
  })
})
afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetLeft')
})

function translateX(style: string | undefined) {
  return Number(style?.match(/translateX\((-?\d+(?:\.\d+)?)px\)/)?.[1])
}

describe('RecommendedCarousel', () => {
  beforeEach(() => {
    clearNuxtData('recommended-products')
    apiMock.mockReset()
  })

  it('reuses the fetched catalog across products instead of refetching', async () => {
    apiMock.mockResolvedValue([product('current'), product('a'), product('b')])
    await mountSuspended(RecommendedCarousel, { props: { currentSlug: 'current', platform: 'Steam' } })
    const wrapper = await mountSuspended(RecommendedCarousel, { props: { currentSlug: 'a', platform: 'Steam' } })

    expect(apiMock).toHaveBeenCalledTimes(1)
    const names = wrapper.findAll('h3').map((h) => h.text())
    expect(names).toContain('current')
    expect(names).not.toContain('a')
  })

  it('starts within the track when the catalog is smaller than the usual clone count', async () => {
    // Regression: a fixed clone count started `index` past the end of an uncloned short track,
    // pushing every real card out of the visible area (prod bug with a 3-product catalog).
    apiMock.mockResolvedValue([product('current'), product('a'), product('b'), product('c')])
    const wrapper = await mountSuspended(RecommendedCarousel, { props: { currentSlug: 'current', platform: 'Steam' } })

    // 3 recommended products, clone count capped to 3: track is [tail(3), real(3), head(3)] = 9 cards.
    expect(wrapper.findAll('article')).toHaveLength(9)
    expect(translateX(wrapper.find('.gap-5').attributes('style'))).toBe(-3 * CARD_STEP)
  })

  it('wraps forward past the end without leaving the track', async () => {
    apiMock.mockResolvedValue([product('current'), product('a'), product('b'), product('c')])
    const wrapper = await mountSuspended(RecommendedCarousel, { props: { currentSlug: 'current', platform: 'Steam' } })
    const track = wrapper.find('.gap-5')

    await wrapper.find('button[aria-label="Siguiente"]').trigger('click')
    await wrapper.find('button[aria-label="Siguiente"]').trigger('click')
    await wrapper.find('button[aria-label="Siguiente"]').trigger('click')
    expect(translateX(track.attributes('style'))).toBe(-6 * CARD_STEP)

    await track.trigger('transitionend')
    expect(translateX(track.attributes('style'))).toBe(-3 * CARD_STEP)
  })

  it('sorts same-platform products first and excludes the current product', async () => {
    apiMock.mockResolvedValue([
      product('current', 'Steam'),
      product('other-platform', 'Xbox'),
      product('same-platform', 'Steam'),
    ])
    const wrapper = await mountSuspended(RecommendedCarousel, { props: { currentSlug: 'current', platform: 'Steam' } })

    const names = wrapper.findAll('h3').map((h) => h.text())
    expect(names).not.toContain('current')
    expect(names.indexOf('same-platform')).toBeLessThan(names.indexOf('other-platform'))
  })

  it('renders nothing when there are no other products in the catalog', async () => {
    apiMock.mockResolvedValue([product('current')])
    const wrapper = await mountSuspended(RecommendedCarousel, { props: { currentSlug: 'current', platform: 'Steam' } })

    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('hides the arrows with a single recommended product', async () => {
    apiMock.mockResolvedValue([product('current'), product('only')])
    const wrapper = await mountSuspended(RecommendedCarousel, { props: { currentSlug: 'current', platform: 'Steam' } })

    expect(wrapper.find('button[aria-label="Siguiente"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Anterior"]').exists()).toBe(false)
  })
})
