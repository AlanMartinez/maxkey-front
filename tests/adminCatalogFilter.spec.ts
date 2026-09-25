import { describe, expect, it } from 'vitest'
import type { AdminProduct, AdminVariant } from '~/types/api'
import {
  DEFAULT_CATALOG_FILTERS,
  catalogFiltersFromQuery,
  catalogFiltersToQuery,
  catalogPlatformOptions,
  filterCatalog,
  hasActiveCatalogFilters,
} from '~/utils/adminCatalogFilter'

function variant(overrides: Partial<AdminVariant> = {}): AdminVariant {
  return { id: 'v', price: 100, currency: 'ARS', sortOrder: 0, isActive: true, isRecommended: false, ...overrides }
}

function product(overrides: Partial<AdminProduct> = {}): AdminProduct {
  return {
    id: overrides.slug ?? 'p',
    slug: 'p',
    name: 'Product',
    platform: 'Steam',
    isActive: true,
    imageKey: 'products/p.png',
    imageUrl: '',
    activationGuideId: 'guide-1',
    activationType: null,
    imageKeys: [],
    images: [],
    description: '',
    variants: [variant()],
    ...overrides,
  }
}

const catalog = [
  product({ slug: 'gta', name: 'GTA V', platform: 'Rockstar', variants: [variant({ price: 500 })] }),
  product({ slug: 'cs', name: 'Counter Strike', platform: 'Steam', variants: [variant({ price: 200, discountPercentage: 10 })] }),
  product({ slug: 'old', name: 'Old Game', platform: 'Steam', isActive: false, imageKey: undefined, variants: [] }),
  product({ slug: 'robux', name: 'Robux', platform: 'Roblox', activationGuideId: null, variants: [variant({ price: 50, isActive: false })] }),
]

const slugs = (products: AdminProduct[]) => products.map((p) => p.slug)
const withFilters = (overrides: Partial<typeof DEFAULT_CATALOG_FILTERS>) => ({ ...DEFAULT_CATALOG_FILTERS, ...overrides })

describe('filterCatalog', () => {
  it('keeps the load order with default filters', () => {
    expect(slugs(filterCatalog(catalog, DEFAULT_CATALOG_FILTERS))).toEqual(['gta', 'cs', 'old', 'robux'])
  })

  it('searches name, platform and slug case-insensitively', () => {
    expect(slugs(filterCatalog(catalog, withFilters({ search: '  ROCKSTAR ' })))).toEqual(['gta'])
    expect(slugs(filterCatalog(catalog, withFilters({ search: 'robux' })))).toEqual(['robux'])
  })

  it('filters by platform and status', () => {
    expect(slugs(filterCatalog(catalog, withFilters({ platform: 'Steam' })))).toEqual(['cs', 'old'])
    expect(slugs(filterCatalog(catalog, withFilters({ platform: 'Steam', status: 'active' })))).toEqual(['cs'])
    expect(slugs(filterCatalog(catalog, withFilters({ status: 'inactive' })))).toEqual(['old'])
  })

  it('flags products that need review', () => {
    expect(slugs(filterCatalog(catalog, withFilters({ review: 'no-variants' })))).toEqual(['old', 'robux'])
    expect(slugs(filterCatalog(catalog, withFilters({ review: 'no-image' })))).toEqual(['old'])
    expect(slugs(filterCatalog(catalog, withFilters({ review: 'no-guide' })))).toEqual(['robux'])
    expect(slugs(filterCatalog(catalog, withFilters({ review: 'discounted' })))).toEqual(['cs'])
  })

  it('sorts by name and by lowest active price, leaving unpriced products last', () => {
    expect(slugs(filterCatalog(catalog, withFilters({ sort: 'name' })))).toEqual(['cs', 'gta', 'old', 'robux'])
    expect(slugs(filterCatalog(catalog, withFilters({ sort: 'price-asc' })))).toEqual(['cs', 'gta', 'old', 'robux'])
    expect(slugs(filterCatalog(catalog, withFilters({ sort: 'price-desc' })))).toEqual(['gta', 'cs', 'old', 'robux'])
  })

  it('does not mutate the source list when sorting', () => {
    const source = [...catalog]
    filterCatalog(source, withFilters({ sort: 'name' }))
    expect(slugs(source)).toEqual(['gta', 'cs', 'old', 'robux'])
  })
})

describe('catalogPlatformOptions', () => {
  it('counts products per platform, most used first', () => {
    expect(catalogPlatformOptions(catalog)).toEqual([
      { value: 'Steam', count: 2 },
      { value: 'Roblox', count: 1 },
      { value: 'Rockstar', count: 1 },
    ])
  })
})

describe('catalog filter query', () => {
  it('round-trips non-default filters and omits defaults', () => {
    const filters = withFilters({ search: ' gta ', platform: 'Rockstar', status: 'active', review: 'no-guide', sort: 'price-desc' })
    const query = catalogFiltersToQuery(filters)

    expect(query).toEqual({ q: 'gta', platform: 'Rockstar', status: 'active', review: 'no-guide', sort: 'price-desc' })
    expect(catalogFiltersFromQuery(query)).toEqual({ ...filters, search: 'gta' })
    expect(catalogFiltersToQuery(DEFAULT_CATALOG_FILTERS)).toEqual({})
  })

  it('falls back to defaults for unknown values', () => {
    expect(catalogFiltersFromQuery({ status: 'deleted', review: 'x', sort: ['name'], platform: '' })).toEqual(DEFAULT_CATALOG_FILTERS)
  })

  it('reports whether any filter is active', () => {
    expect(hasActiveCatalogFilters(DEFAULT_CATALOG_FILTERS)).toBe(false)
    expect(hasActiveCatalogFilters(withFilters({ search: '   ' }))).toBe(false)
    expect(hasActiveCatalogFilters(withFilters({ sort: 'name' }))).toBe(true)
  })
})
