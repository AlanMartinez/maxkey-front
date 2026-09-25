import type { ProductSummary } from '~/types/api'

/**
 * Session cache of catalog summaries keyed by slug, so the product page can paint name, image and
 * price the instant a card is clicked while the full detail request is still in flight.
 */
export function useProductPreview() {
  const previews = useState<Record<string, ProductSummary>>('product-previews', () => ({}))

  function remember(product: ProductSummary) {
    previews.value[product.slug] = product
  }

  function get(slug: string): ProductSummary | undefined {
    return previews.value[slug]
  }

  return { remember, get }
}
