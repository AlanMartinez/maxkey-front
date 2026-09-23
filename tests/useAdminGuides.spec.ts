import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ApiError } from '~/composables/useApi'
import { useAdminGuides } from '~/composables/useAdminGuides'
import type { GuideDto } from '~/types/api'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)

function buildGuide(): GuideDto {
  return { id: 'g1', slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '## Paso 1' }
}

beforeEach(() => {
  apiMock.mockReset()
})

describe('useAdminGuides createGuide', () => {
  it('posts the guide and appends it locally', async () => {
    apiMock.mockResolvedValueOnce([]).mockResolvedValueOnce(buildGuide())
    const guides = await useAdminGuides()

    const result = await guides.createGuide({ slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '## Paso 1' })

    expect(apiMock).toHaveBeenCalledWith('/admin/guides', { method: 'POST', body: { slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '## Paso 1' } })
    expect(result).toBe(true)
    expect(guides.guides.value).toHaveLength(1)
  })

  it('surfaces a 409 conflict without adding a duplicate locally', async () => {
    apiMock.mockResolvedValueOnce([]).mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Conflict', status: 409 }))
    const guides = await useAdminGuides()

    const result = await guides.createGuide({ slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '' })

    expect(result).toBe(false)
    expect(guides.guides.value).toHaveLength(0)
    expect(guides.saveError.value).toBeInstanceOf(ApiError)
  })
})

describe('useAdminGuides deleteGuide', () => {
  it('deletes via DELETE and removes it from local state', async () => {
    apiMock.mockResolvedValueOnce([buildGuide()]).mockResolvedValueOnce(undefined)
    const guides = await useAdminGuides()

    const result = await guides.deleteGuide('g1')

    expect(apiMock).toHaveBeenCalledWith('/admin/guides/g1', { method: 'DELETE' })
    expect(result).toBe(true)
    expect(guides.guides.value).toHaveLength(0)
  })

  it('keeps the guide locally and surfaces an error on 409 (guide still linked to a product)', async () => {
    apiMock.mockResolvedValueOnce([buildGuide()]).mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Conflict', status: 409 }))
    const guides = await useAdminGuides()

    const result = await guides.deleteGuide('g1')

    expect(result).toBe(false)
    expect(guides.guides.value).toHaveLength(1)
  })
})
