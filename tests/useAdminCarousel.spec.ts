import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useAdminCarousel } from '~/composables/useAdminCarousel'

const { apiMock, toastMock, useAsyncDataMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  toastMock: vi.fn(() => ({ error: vi.fn() })),
  useAsyncDataMock: vi.fn(() => new Promise(() => {})),
}))

mockNuxtImport('useApi', () => () => apiMock)
mockNuxtImport('useToast', () => toastMock)
mockNuxtImport('useAsyncData', () => useAsyncDataMock)

beforeEach(() => {
  apiMock.mockReset()
  toastMock.mockClear()
  useAsyncDataMock.mockClear()
})

describe('useAdminCarousel', () => {
  it('acquires both async data resources before awaiting either response', async () => {
    void useAdminCarousel()

    expect(toastMock).toHaveBeenCalledOnce()
    expect(useAsyncDataMock).toHaveBeenCalledTimes(2)
  })
})
