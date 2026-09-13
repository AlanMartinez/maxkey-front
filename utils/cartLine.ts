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
