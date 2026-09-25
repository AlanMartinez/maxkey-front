import { describe, expect, it } from 'vitest'
import { PLACEHOLDER_IMAGE, productImageUrl, resizedImageUrl } from '~/utils/productImage'

describe('productImageUrl', () => {
  it('returns the product imageUrl when present', () => {
    expect(productImageUrl({ imageUrl: '/images/products/riot.png' })).toBe('/images/products/riot.png')
  })

  it('falls back to the placeholder when imageUrl is empty, with no per-slug override map', () => {
    expect(productImageUrl({ imageUrl: '' })).toBe(PLACEHOLDER_IMAGE)
  })

  it('resizes ImageKit-hosted images via a tr= transform so the browser never downscales the original', () => {
    const url = productImageUrl({ imageUrl: 'https://ik.imagekit.io/chekeys/products/free-fire.jpg' })
    expect(url).toBe('https://ik.imagekit.io/chekeys/products/free-fire.jpg?tr=w-424,q-80,f-auto')
  })
})

describe('resizedImageUrl', () => {
  it('leaves non-ImageKit urls untouched', () => {
    expect(resizedImageUrl('/images/products/placeholder.svg', 424)).toBe('/images/products/placeholder.svg')
  })

  it('applies the requested width to an ImageKit url', () => {
    const url = resizedImageUrl('https://ik.imagekit.io/chekeys/products/robux.png', 200)
    expect(url).toContain('tr=w-200')
  })
})
