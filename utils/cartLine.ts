import type { CartLine } from '~/composables/useCart'
import type { ProductDetail, ProductVariantDto } from '~/types/api'
import { productImageUrl } from '~/utils/productImage'

/**
 * The backend-flagged recommended variant is preselected everywhere; the API only returns active
 * variants in catalog order, so the first one is the fallback when none is flagged.
 */
export function defaultVariant<T extends ProductVariantDto>(variants: T[]): T | undefined {
  return recommendedVariant(variants) ?? variants[0]
}

/** Builds the cart line for a variant; prices are indicative, the server recomputes them at checkout. */
export function toCartLine(product: Pick<ProductDetail, 'slug' | 'name' | 'imageUrl'>, variant: ProductVariantDto): Omit<CartLine, 'quantity'> {
  return {
    variantId: variant.id,
    productSlug: product.slug,
    productName: product.name,
    variantName: variant.name,
    unitPrice: variant.price,
    currency: variant.currency,
    imageUrl: productImageUrl(product),
  }
}

/** The "Más elegido" tag follows the admin-set `isRecommended` flag (at most one per product); nothing is tagged otherwise. */
export function recommendedVariant<T extends ProductVariantDto>(variants: T[]): T | undefined {
  return variants.find((v) => v.isRecommended)
}

/**
 * Gallery sources for the product page: the `images` list when non-empty, else the dedicated
 * `detailImageUrl` (sized for the wider product view), falling back to the catalog `imageUrl`
 * only when no detail image was configured.
 */
export function galleryImages(product: Pick<ProductDetail, 'slug' | 'imageUrl' | 'detailImageUrl' | 'images'>): string[] {
  if (product.images?.length) return product.images
  return [product.detailImageUrl || productImageUrl(product)]
}
