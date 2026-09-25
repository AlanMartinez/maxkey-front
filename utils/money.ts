import type { ProductSummary, ProductVariantDto } from '~/types/api'

/** Formats an amount for the es-AR audience (e.g. `$ 9.990`). Prices are indicative; the server recomputes. */
export function formatMoney(amount: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export interface DisplayPrice {
  price: number
  oldPrice?: number
  currency: string
}

/** The variant's price once loaded; until then the catalog summary's price (catalog prices are ARS). */
export function displayPrice(
  variant: ProductVariantDto | undefined,
  preview: Pick<ProductSummary, 'fromPrice' | 'oldPrice'> | undefined,
): DisplayPrice | null {
  if (variant) return { price: variant.price, oldPrice: variant.oldPrice, currency: variant.currency }
  if (preview) return { price: preview.fromPrice, oldPrice: preview.oldPrice, currency: 'ARS' }
  return null
}

export function discountPercent(price: DisplayPrice | null): number {
  return price?.oldPrice ? Math.round((1 - price.price / price.oldPrice) * 100) : 0
}
