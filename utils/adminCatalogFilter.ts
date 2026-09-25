import type { AdminProduct } from '~/types/api'

export type CatalogStatusFilter = 'all' | 'active' | 'inactive'
export type CatalogReviewFilter = 'all' | 'no-variants' | 'no-image' | 'no-guide' | 'discounted'
export type CatalogSort = 'default' | 'name' | 'price-asc' | 'price-desc'

export interface CatalogFilters {
  search: string
  platform: string
  status: CatalogStatusFilter
  review: CatalogReviewFilter
  sort: CatalogSort
}

export const DEFAULT_CATALOG_FILTERS: Readonly<CatalogFilters> = {
  search: '',
  platform: 'all',
  status: 'all',
  review: 'all',
  sort: 'default',
}

const STATUS_VALUES: readonly CatalogStatusFilter[] = ['all', 'active', 'inactive']
const REVIEW_VALUES: readonly CatalogReviewFilter[] = ['all', 'no-variants', 'no-image', 'no-guide', 'discounted']
const SORT_VALUES: readonly CatalogSort[] = ['default', 'name', 'price-asc', 'price-desc']

function hasActiveVariant(product: AdminProduct) {
  return product.variants.some((v) => v.isActive)
}

function isDiscounted(product: AdminProduct) {
  return product.variants.some((v) => v.isActive && ((v.discountPercentage ?? 0) > 0 || (v.oldPrice ?? 0) > v.price))
}

/** Lowest active price; products without an active variant sort last in either direction. */
function lowestPrice(product: AdminProduct) {
  const prices = product.variants.filter((v) => v.isActive).map((v) => v.price)
  return prices.length ? Math.min(...prices) : undefined
}

function matchesReview(product: AdminProduct, review: CatalogReviewFilter) {
  switch (review) {
    case 'no-variants':
      return !hasActiveVariant(product)
    case 'no-image':
      return !product.imageKey
    case 'no-guide':
      return !product.activationGuideId
    case 'discounted':
      return isDiscounted(product)
    default:
      return true
  }
}

function compareByPrice(a: AdminProduct, b: AdminProduct, direction: 1 | -1) {
  const pa = lowestPrice(a)
  const pb = lowestPrice(b)
  if (pa === undefined) return pb === undefined ? 0 : 1
  if (pb === undefined) return -1
  return (pa - pb) * direction
}

export function filterCatalog(products: readonly AdminProduct[], filters: CatalogFilters): AdminProduct[] {
  const term = filters.search.trim().toLowerCase()
  const result = products.filter((p) => {
    if (term && !`${p.name} ${p.platform} ${p.slug}`.toLowerCase().includes(term)) return false
    if (filters.platform !== 'all' && p.platform !== filters.platform) return false
    if (filters.status === 'active' && !p.isActive) return false
    if (filters.status === 'inactive' && p.isActive) return false
    return matchesReview(p, filters.review)
  })
  if (filters.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  if (filters.sort === 'price-asc') result.sort((a, b) => compareByPrice(a, b, 1))
  if (filters.sort === 'price-desc') result.sort((a, b) => compareByPrice(a, b, -1))
  return result
}

/** Platforms present in the loaded catalog with their product count, most used first. */
export function catalogPlatformOptions(products: readonly AdminProduct[]) {
  const counts = new Map<string, number>()
  for (const p of products) counts.set(p.platform, (counts.get(p.platform) ?? 0) + 1)
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

export function hasActiveCatalogFilters(filters: CatalogFilters) {
  return (Object.keys(DEFAULT_CATALOG_FILTERS) as (keyof CatalogFilters)[]).some((key) =>
    key === 'search' ? filters.search.trim() !== '' : filters[key] !== DEFAULT_CATALOG_FILTERS[key],
  )
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

/** Reads filters from the route query, ignoring unknown values so a stale link never breaks the page. */
export function catalogFiltersFromQuery(query: Record<string, unknown>): CatalogFilters {
  return {
    search: typeof query.q === 'string' ? query.q : DEFAULT_CATALOG_FILTERS.search,
    platform: typeof query.platform === 'string' && query.platform ? query.platform : DEFAULT_CATALOG_FILTERS.platform,
    status: pick(query.status, STATUS_VALUES, DEFAULT_CATALOG_FILTERS.status),
    review: pick(query.review, REVIEW_VALUES, DEFAULT_CATALOG_FILTERS.review),
    sort: pick(query.sort, SORT_VALUES, DEFAULT_CATALOG_FILTERS.sort),
  }
}

/** Only non-default filters reach the URL, keeping shared links short. */
export function catalogFiltersToQuery(filters: CatalogFilters): Record<string, string> {
  const query: Record<string, string> = {}
  if (filters.search.trim()) query.q = filters.search.trim()
  if (filters.platform !== DEFAULT_CATALOG_FILTERS.platform) query.platform = filters.platform
  if (filters.status !== DEFAULT_CATALOG_FILTERS.status) query.status = filters.status
  if (filters.review !== DEFAULT_CATALOG_FILTERS.review) query.review = filters.review
  if (filters.sort !== DEFAULT_CATALOG_FILTERS.sort) query.sort = filters.sort
  return query
}
