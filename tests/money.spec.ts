import { describe, expect, it } from 'vitest'
import { discountPercent, displayPrice } from '~/utils/money'
import type { ProductVariantDto } from '~/types/api'

const variant: ProductVariantDto = { id: 'v1', name: 'Base', price: 800, oldPrice: 1000, currency: 'USD', isRecommended: true }

describe('displayPrice', () => {
  it('prefers the loaded variant over the catalog preview', () => {
    expect(displayPrice(variant, { fromPrice: 500 })).toEqual({ price: 800, oldPrice: 1000, currency: 'USD' })
  })

  it('falls back to the catalog preview in ARS while the variant loads', () => {
    expect(displayPrice(undefined, { fromPrice: 500, oldPrice: 2000 })).toEqual({ price: 500, oldPrice: 2000, currency: 'ARS' })
  })

  it('returns null when nothing is known yet', () => {
    expect(displayPrice(undefined, undefined)).toBeNull()
  })
})

describe('discountPercent', () => {
  it('rounds the discount against the old price', () => {
    expect(discountPercent({ price: 300, oldPrice: 1000, currency: 'ARS' })).toBe(70)
  })

  it('is zero without an old price', () => {
    expect(discountPercent({ price: 300, currency: 'ARS' })).toBe(0)
    expect(discountPercent(null)).toBe(0)
  })
})
