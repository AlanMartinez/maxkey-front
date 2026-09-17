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
    activationGuideUrl: null,
    activationType: null,
    imageKeys: [],
    images: [],
    description: '',
    variants: [
      { id: 'v1', region: 'AR', edition: 'Standard', price: 9500, oldPrice: undefined, discountPercentage: undefined, currency: 'ARS', sortOrder: 0, isActive: true },
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
    expect(catalog.products.value[0]?.variants).toHaveLength(0)
  })

  it('surfaces an error and keeps the variant on failure', async () => {
    apiMock.mockResolvedValueOnce([buildProduct()]).mockRejectedValueOnce(
      new ApiError({ type: 'about:blank', title: 'Conflict', status: 409 }),
    )
    const catalog = await useAdminCatalog()

    const result = await catalog.deleteVariant('p1', 'v1')

    expect(result).toBe(false)
    expect(catalog.products.value[0]?.variants).toHaveLength(1)
    expect(catalog.saveError.value).toBeInstanceOf(ApiError)
  })
})
