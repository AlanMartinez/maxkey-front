import { describe, expect, it } from 'vitest'
import { defaultVariant, galleryImages, recommendedVariant, toCartLine } from '~/utils/cartLine'

const cheap = { id: 'v1', name: '1.750 RP', price: 9990, currency: 'ARS' }
const discounted = { id: 'v2', name: '3.500 RP', price: 18500, oldPrice: 21000, currency: 'ARS' }
const product = { slug: 'riot-points', name: 'Riot Points', imageUrl: 'https://cdn/x.png', images: [] as string[] }

describe('cartLine helpers', () => {
  it('treats the first variant as the default and the first discounted one as recommended', () => {
    expect(defaultVariant([cheap, discounted])?.id).toBe('v1')
    expect(defaultVariant([])).toBeUndefined()
    expect(recommendedVariant([cheap, discounted])?.id).toBe('v2')
    expect(recommendedVariant([cheap])).toBeUndefined()
  })

  it('builds a cart line from product and variant', () => {
    expect(toCartLine(product, discounted)).toEqual({
      variantId: 'v2', productSlug: 'riot-points', productName: 'Riot Points', variantName: '3.500 RP', unitPrice: 18500, currency: 'ARS', imageUrl: 'https://cdn/x.png',
    })
  })

  it('falls back to the single catalog image when the gallery list is empty', () => {
    expect(galleryImages(product)).toEqual(['https://cdn/x.png'])
    expect(galleryImages({ ...product, images: [] })).toEqual(['https://cdn/x.png'])
    expect(galleryImages({ ...product, images: ['/1.png', '/2.png'] })).toEqual(['/1.png', '/2.png'])
  })
})
