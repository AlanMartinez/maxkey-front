import { defineStore } from 'pinia'
import type { ProductSummary } from '~/types/api'

/**
 * Catalog summaries seen this session, keyed by slug. The product page paints name, image, price and
 * platform from here the instant it opens, while the full detail request is still in flight.
 */
export const useProductPreviewStore = defineStore('productPreview', () => {
  const bySlug = ref<Record<string, ProductSummary>>({})

  function rememberAll(products: readonly ProductSummary[]) {
    for (const product of products) bySlug.value[product.slug] = product
  }

  function get(slug: string): ProductSummary | undefined {
    return bySlug.value[slug]
  }

  return { bySlug, rememberAll, get }
})
