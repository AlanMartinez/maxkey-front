import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PlatformLogo from '~/components/ui/PlatformLogo.vue'

describe('PlatformLogo', () => {
  it('prefers the real color app icon when one is available', async () => {
    const wrapper = await mountSuspended(PlatformLogo, { props: { platform: 'Steam' } })

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('/images/platforms/color/steam.svg')
    expect(img.attributes('alt')).toBe('Steam')
    expect(wrapper.text()).toBe('')
  })

  it('falls back to the brand color behind the flat mark when there is no color icon', async () => {
    const wrapper = await mountSuspended(PlatformLogo, { props: { platform: 'PlayStation' } })

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('/images/platforms/playstation.svg')
    expect(wrapper.find('span').attributes('style')).toContain('background-color: #0070D1')
  })

  it('falls back to the platform text when the value is not in the enum', async () => {
    const wrapper = await mountSuspended(PlatformLogo, { props: { platform: 'Cross-platform' } })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('Cross-platform')
  })
})
