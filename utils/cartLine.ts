import type { CartLine } from '~/composables/useCart'
import type { ProductDetail, ProductVariantDto } from '~/types/api'
import { productImageUrl } from '~/utils/productImage'

/** The API only returns active variants in catalog order, so the first one is the default selection everywhere. */
export function defaultVariant<T extends ProductVariantDto>(variants: T[]): T | undefined {
  return variants[0]
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

/**
 * Placeholder heuristic for the "Más elegido" tag until the API exposes popularity:
 * the first discounted variant wins; without discounts nothing is tagged.
 */
export function recommendedVariant<T extends ProductVariantDto>(variants: T[]): T | undefined {
  return variants.find((v) => v.oldPrice !== undefined && v.oldPrice > v.price)
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
