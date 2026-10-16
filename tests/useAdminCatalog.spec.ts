import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ApiError } from '~/composables/useApi'
import { useAdminCatalog } from '~/composables/useAdminCatalog'
import type { AdminProduct } from '~/types/api'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)

function buildProduct(): AdminProduct {
  return {
    id: 'p1',
    slug: 'roblox-100',
    name: 'Roblox - 100 Robux',
    platform: 'Cross-platform',
    isActive: true,
    imageKey: undefined,
    imageUrl: '',
    detailImageKey: undefined,
    detailImageUrl: undefined,
    activationGuideId: null,
    activationType: null,
    imageKeys: [],
    images: [],
    description: '',
    variants: [
      { id: 'v1', region: 'AR', edition: 'Standard', price: 9500, oldPrice: undefined, discountPercentage: undefined, currency: 'ARS', sortOrder: 0, isActive: true, isRecommended: true },
      { id: 'v2', region: 'AR', edition: 'Deluxe', price: 12000, oldPrice: undefined, discountPercentage: undefined, currency: 'ARS', sortOrder: 1, isActive: true, isRecommended: false },
    ],
  }
}

beforeEach(() => {
  apiMock.mockReset()
})

describe('useAdminCatalog deleteVariant', () => {
  it('hard-deletes via DELETE and removes the variant from local state', async () => {
    apiMock.mockResolvedValueOnce([buildProduct()]).mockResolvedValueOnce(undefined)
    const catalog = await useAdminCatalog()

    const result = await catalog.deleteVariant('p1', 'v1')

    expect(apiMock).toHaveBeenCalledWith('/admin/catalog/variants/v1', { method: 'DELETE' })
    expect(result).toBe(true)
    expect(catalog.products.value[0]?.variants).toHaveLength(1)
  })

  it('surfaces an error and keeps the variant on failure', async () => {
    apiMock.mockResolvedValueOnce([buildProduct()]).mockRejectedValueOnce(
      new ApiError({ type: 'about:blank', title: 'Conflict', status: 409 }),
    )
    const catalog = await useAdminCatalog()

    const result = await catalog.deleteVariant('p1', 'v1')

    expect(result).toBe(false)
    expect(catalog.products.value[0]?.variants).toHaveLength(2)
    expect(catalog.saveError.value).toBeInstanceOf(ApiError)
  })
})

describe('useAdminCatalog saveVariant', () => {
  it('clears the sibling recommended flags locally when a variant is marked', async () => {
    const product = buildProduct()
    const body = { price: 12000, currency: 'ARS' as const, region: 'AR', edition: 'Deluxe', sortOrder: 1, isActive: true, isRecommended: true }
    apiMock.mockResolvedValueOnce([product]).mockResolvedValueOnce({ ...product.variants[1], isRecommended: true })
    const catalog = await useAdminCatalog()

    const result = await catalog.saveVariant('p1', 'v2', body)

    expect(apiMock).toHaveBeenCalledWith('/admin/catalog/variants/v2', { method: 'PUT', body })
    expect(result).toBe(true)
    expect(catalog.products.value[0]?.variants.map((v) => v.isRecommended)).toEqual([false, true])
  })

  it('leaves the siblings untouched when the saved variant is not recommended', async () => {
    const product = buildProduct()
    const body = { price: 12000, currency: 'ARS' as const, region: 'AR', edition: 'Deluxe', sortOrder: 1, isActive: true, isRecommended: false }
    apiMock.mockResolvedValueOnce([product]).mockResolvedValueOnce({ ...product.variants[1] })
    const catalog = await useAdminCatalog()

    await catalog.saveVariant('p1', 'v2', body)

    expect(catalog.products.value[0]?.variants.map((v) => v.isRecommended)).toEqual([true, false])
  })
})

describe('useAdminCatalog permanentlyDeleteProduct', () => {
  it('calls DELETE .../permanent with force=false and removes the product on 204', async () => {
    apiMock.mockResolvedValueOnce([buildProduct()]).mockResolvedValueOnce(undefined)
    const catalog = await useAdminCatalog()

    const result = await catalog.permanentlyDeleteProduct('p1')

    expect(apiMock).toHaveBeenCalledWith('/admin/catalog/products/p1/permanent', { method: 'DELETE', query: { force: false } })
    expect(result).toEqual({ status: 'deleted' })
    expect(catalog.products.value).toHaveLength(0)
    expect(catalog.saving.value).toBe(false)
  })

  it('returns the availableKeys count on a 409 without deleting or surfacing an error', async () => {
    apiMock.mockResolvedValueOnce([buildProduct()]).mockRejectedValueOnce(
      new ApiError({ type: 'about:blank', title: 'Product has available keys', status: 409, availableKeys: 3 }),
    )
    const catalog = await useAdminCatalog()

    const result = await catalog.permanentlyDeleteProduct('p1')

    expect(result).toEqual({ status: 'hasAvailableKeys', availableKeys: 3 })
    expect(catalog.products.value).toHaveLength(1)
    expect(catalog.saveError.value).toBeNull()
  })

  it('sends force=true when forcing', async () => {
    apiMock.mockResolvedValueOnce([buildProduct()]).mockResolvedValueOnce(undefined)
    const catalog = await useAdminCatalog()

    const result = await catalog.permanentlyDeleteProduct('p1', true)

    expect(apiMock).toHaveBeenCalledWith('/admin/catalog/products/p1/permanent', { method: 'DELETE', query: { force: true } })
    expect(result).toEqual({ status: 'deleted' })
  })

  it('fails and keeps the product on 404', async () => {
    apiMock.mockResolvedValueOnce([buildProduct()]).mockRejectedValueOnce(
      new ApiError({ type: 'about:blank', title: 'Product not found', status: 404 }),
    )
    const catalog = await useAdminCatalog()

    const result = await catalog.permanentlyDeleteProduct('p1')

    expect(result).toEqual({ status: 'failed' })
    expect(catalog.products.value).toHaveLength(1)
    expect(catalog.saveError.value?.status).toBe(404)
  })
})
