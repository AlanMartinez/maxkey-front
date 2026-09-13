import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import HeroCarousel from '~/components/catalog/HeroCarousel.vue'

function activeIndex(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  return wrapper.findAll('[role="tab"]').findIndex((tab) => tab.attributes('aria-selected') === 'true')
}

describe('HeroCarousel', () => {
  it('fills the frame with the slide image and overlays the controls', async () => {
    const wrapper = await mountSuspended(HeroCarousel)

    expect(wrapper.find('section').classes()).toEqual(expect.arrayContaining(['overflow-hidden', 'rounded-3xl', 'aspect-[2172/724]']))
    expect(wrapper.find('img').classes()).toContain('object-cover')
    expect(wrapper.find('[role="tablist"]').classes()).toContain('absolute')
    expect(activeIndex(wrapper)).toBe(0)
  })

  it('moves with the arrow buttons, wrapping around, and with the keyboard', async () => {
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
})
