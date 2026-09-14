import type { ProductSummary } from '~/types/api'

/** R2 placeholder shown when a product has no `imageUrl` yet (admin-dashboard design.md D6). */
export const PLACEHOLDER_IMAGE = '/images/products/placeholder.png'

export function productImageUrl(product: Pick<ProductSummary, 'imageUrl'>): string {
  return product.imageUrl || PLACEHOLDER_IMAGE
}
