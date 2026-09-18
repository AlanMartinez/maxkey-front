import { describe, expect, it } from 'vitest'
import { PLATFORMS, findPlatform } from '~/utils/platforms'

describe('platforms', () => {
  it('lists the most popular platforms first, with Steam on top', () => {
    expect(PLATFORMS.slice(0, 3).map((p) => p.value)).toEqual(['Steam', 'PlayStation', 'Xbox'])
  })

  it('every platform points at a logo under /images/platforms', () => {
    for (const platform of PLATFORMS) expect(platform.logo).toMatch(/^\/images\/platforms\/[a-z]+\.svg$/)
  })

  it('finds a platform by its stored value', () => {
    expect(findPlatform('Epic Games')?.logo).toBe('/images/platforms/epicgames.svg')
  })

  it('returns undefined for legacy free-text values so callers can fall back to text', () => {
    expect(findPlatform('Cross-platform')).toBeUndefined()
    expect(findPlatform('')).toBeUndefined()
  })
})
