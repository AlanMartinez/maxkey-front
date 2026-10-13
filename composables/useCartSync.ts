import type { ProductDetail } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import type { CatalogAvailability } from '~/composables/useCart'

/**
 * Re-checks every cart line against the public catalog (which only lists active products and variants):
 * a 404 or a missing variant means it is no longer on sale and the line is dropped; other failures keep it,
 * since the server validates again at checkout. `removed` holds how many lines the last sync dropped.
 */
export function useCartSync() {
  const { lines, syncCatalog } = useCart()
  const api = useApi()
  const removed = useState('cart-sync-removed', () => 0)
  let syncVersion = 0

  async function sync() {
    const version = ++syncVersion
    const slugs = [...new Set(lines.value.map((line) => line.productSlug))]
    if (!slugs.length) return
    const products = await Promise.all(slugs.map(async (slug): Promise<CatalogAvailability | null> => {
      try {
        const detail = await api<ProductDetail>(`/catalog/products/${slug}`)
        return {
          productSlug: slug,
          variants: detail.variants.map((variant) => ({ variantId: variant.id, unitPrice: variant.price, currency: variant.currency })),
        }
      } catch (e) {
        return e instanceof ApiError && e.status === 404 ? { productSlug: slug, variants: null } : null
      }
    }))
    if (version !== syncVersion) return
    removed.value = syncCatalog(products.filter((product) => product !== null))
  }

  return { sync, removed }
}
