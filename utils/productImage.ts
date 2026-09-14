import type { ProductSummary } from '~/types/api'

// Local artwork for the four seeded catalog products.
const catalogImages = new Map<string, string>([
  ['steam-wallet-gift-card', '/images/products/steam-wallet-gift-card-test.png'],
  ['playstation-plus-membership', '/images/products/playstation-plus-membership-test.png'],
  ['fc-25-points', '/images/products/fc-25-points-test.png'],
  ['xbox-game-pass-ultimate', '/images/products/xbox-game-pass-ultimate-test.png'],
])

export function productImageUrl(product: Pick<ProductSummary, 'slug' | 'imageUrl'>): string {
  return catalogImages.get(product.slug) ?? product.imageUrl
}
