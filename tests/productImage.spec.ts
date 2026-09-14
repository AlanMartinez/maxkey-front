import { describe, expect, it } from 'vitest'
import { PLACEHOLDER_IMAGE, productImageUrl } from '~/utils/productImage'

describe('productImageUrl', () => {
  it('returns the product imageUrl when present', () => {
    expect(productImageUrl({ imageUrl: '/images/products/riot.png' })).toBe('/images/products/riot.png')
  })

  it('falls back to the placeholder when imageUrl is empty, with no per-slug override map', () => {
    expect(productImageUrl({ imageUrl: '' })).toBe(PLACEHOLDER_IMAGE)
  })
})
