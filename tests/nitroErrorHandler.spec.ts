import { describe, expect, it } from 'vitest'
import config from '../nuxt.config'

// Regression guard for the branded 404: a custom `nitro.errorHandler` replaces (does not extend) the
// Nuxt handler that renders error.vue, and the old handlers redirected fatal 404s to an external domain.
describe('nuxt.config error pipeline', () => {
  it('leaves Nuxt error rendering in place: no custom Nitro error handlers', () => {
    expect(config.nitro?.errorHandler).toBeUndefined()
    expect(config.nitro?.devErrorHandler).toBeUndefined()
  })

  it('declares the branded default head (title, description, dark theme-color, og:site_name)', () => {
    const head = config.app?.head
    const meta = (key: 'name' | 'property', value: string) => head?.meta?.find((m) => m?.[key] === value)?.content

    expect(head?.title).toBe('Chekeys')
    expect(meta('name', 'description')).toBeTruthy()
    expect(meta('name', 'theme-color')).toBe('#0A0A0E')
    expect(meta('property', 'og:site_name')).toBe('Chekeys')
  })
})
