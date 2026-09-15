import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { clearNuxtState, useCookie } from '#app'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { REDIRECT_COOKIE_KEY } from '~/composables/useAuth'
import authMiddleware from '~/middleware/auth'

type FakeSession = { access_token: string } | null

const { navigateToMock, getSessionMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn((to: unknown) => ({ __navigateTo: to })),
  getSessionMock: vi.fn(),
}))

mockNuxtImport('useSupabaseClient', () => () => ({ auth: { getSession: getSessionMock } }))
mockNuxtImport('navigateTo', () => navigateToMock)

function route(fullPath: string) {
  return { fullPath } as RouteLocationNormalized
}

function mockSession(session: FakeSession) {
  getSessionMock.mockResolvedValue({ data: { session } })
}

beforeEach(() => {
  clearNuxtState()
  navigateToMock.mockClear()
  getSessionMock.mockReset()
  mockSession(null)
})

describe('middleware/auth', () => {
  it('redirects unauthenticated visitors to /?login=1 and remembers the intended path', async () => {
    const result = await authMiddleware(route('/account/orders'), route('/'))

    expect(navigateToMock).toHaveBeenCalledWith('/?login=1')
    expect(result).toEqual({ __navigateTo: '/?login=1' })

    // Cookie writes flush through a Vue watcher (async); a fresh `useCookie()` call re-reads `document.cookie`.
    await nextTick()
    expect(useCookie(REDIRECT_COOKIE_KEY).value).toBe('/account/orders')
  })

  it('lets authenticated visitors through', async () => {
    mockSession({ access_token: 't1' })

    const result = await authMiddleware(route('/account/orders'), route('/'))

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
