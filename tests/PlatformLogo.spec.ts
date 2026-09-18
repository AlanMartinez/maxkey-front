import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PlatformLogo from '~/components/ui/PlatformLogo.vue'

describe('PlatformLogo', () => {
  it('renders the logo image with the platform name as alt for a known platform', async () => {
    const wrapper = await mountSuspended(PlatformLogo, { props: { platform: 'Steam' } })

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('/images/platforms/steam.svg')
    expect(img.attributes('alt')).toBe('Steam')
    expect(wrapper.text()).toBe('')
  })

  it('falls back to the platform text when the value is not in the enum', async () => {
    const wrapper = await mountSuspended(PlatformLogo, { props: { platform: 'Cross-platform' } })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('Cross-platform')
  })
})
