import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { clearNuxtState, useCookie } from '#app'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { REDIRECT_COOKIE_KEY } from '~/composables/useAuth'
import { ApiError } from '~/composables/useApi'
import adminMiddleware from '~/middleware/admin'

type FakeSession = { access_token: string } | null

const { navigateToMock, apiMock, getSessionMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn((to: unknown) => ({ __navigateTo: to })),
  apiMock: vi.fn(),
  getSessionMock: vi.fn(),
}))

mockNuxtImport('useSupabaseClient', () => () => ({ auth: { getSession: getSessionMock } }))
mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useApi', () => () => apiMock)

function route(fullPath: string) {
  return { fullPath } as RouteLocationNormalized
}

function mockSession(session: FakeSession) {
  getSessionMock.mockResolvedValue({ data: { session } })
}

beforeEach(() => {
  clearNuxtState()
  navigateToMock.mockClear()
  apiMock.mockReset()
  getSessionMock.mockReset()
  mockSession(null)
})

describe('middleware/admin', () => {
  it('redirects visitors without a session to /?login=1 without calling the API', async () => {
    const result = await adminMiddleware(route('/admin'), route('/'))

    expect(apiMock).not.toHaveBeenCalled()
    expect(navigateToMock).toHaveBeenCalledWith('/?login=1')
    expect(result).toEqual({ __navigateTo: '/?login=1' })
    await nextTick()
    expect(useCookie(REDIRECT_COOKIE_KEY).value).toBe('/admin')
  })

  it('lets an admin through and caches the check so it is not repeated', async () => {
    mockSession({ access_token: 't1' })
    apiMock.mockResolvedValue({ sub: 'u1' })

    const result = await adminMiddleware(route('/admin'), route('/'))
    expect(result).toBeUndefined()
    expect(apiMock).toHaveBeenCalledWith('/admin/me')

    const second = await adminMiddleware(route('/admin/catalog'), route('/admin'))
    expect(second).toBeUndefined()
    expect(apiMock).toHaveBeenCalledTimes(1)
  })

  it('redirects to / when the API rejects with 403', async () => {
    mockSession({ access_token: 't1' })
    apiMock.mockRejectedValue(new ApiError({ type: 'about:blank', title: 'Forbidden', status: 403 }))

    const result = await adminMiddleware(route('/admin'), route('/'))

    expect(navigateToMock).toHaveBeenCalledWith('/')
    expect(result).toEqual({ __navigateTo: '/' })
  })

  it('redirects to /?login=1 when the API rejects with 401', async () => {
    mockSession({ access_token: 't1' })
    apiMock.mockRejectedValue(new ApiError({ type: 'about:blank', title: 'Unauthorized', status: 401 }))

    const result = await adminMiddleware(route('/account'), route('/'))

    expect(navigateToMock).toHaveBeenCalledWith('/?login=1')
    await nextTick()
    expect(useCookie(REDIRECT_COOKIE_KEY).value).toBe('/account')
  })
})
