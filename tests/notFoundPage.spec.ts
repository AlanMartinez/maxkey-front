import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import NotFoundPage from '~/pages/[...slug].vue'

const { createErrorSpy, navigateToMock } = vi.hoisted(() => ({
  createErrorSpy: vi.fn(),
  navigateToMock: vi.fn(),
}))

// Wraps the real createError so the thrown error keeps Nuxt's normalization; the spy only records the call.
mockNuxtImport('createError', (original) => (...args: Parameters<typeof original>) => {
  createErrorSpy(...args)
  return original(...args)
})
mockNuxtImport('navigateTo', () => navigateToMock)

describe('pages/[...slug]', () => {
  beforeEach(() => {
    createErrorSpy.mockClear()
    navigateToMock.mockClear()
  })

  it('throws a fatal 404 so error.vue renders, instead of redirecting externally', async () => {
    await mountSuspended(NotFoundPage).catch(() => undefined)

    expect(createErrorSpy).toHaveBeenCalledWith({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
