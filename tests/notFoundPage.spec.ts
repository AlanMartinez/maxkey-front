import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import NotFoundPage from '~/pages/[...slug].vue'

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
}))

mockNuxtImport('navigateTo', () => navigateToMock)

describe('pages/[...slug]', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
  })

  it('redirects an unmatched route to Chekeys home', async () => {
    await mountSuspended(NotFoundPage)

    expect(navigateToMock).toHaveBeenCalledWith('https://www.chekeys.com', { external: true })
  })
})
