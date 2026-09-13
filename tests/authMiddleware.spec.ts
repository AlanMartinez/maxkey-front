import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { clearNuxtState, useCookie } from '#app'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { REDIRECT_COOKIE_KEY } from '~/composables/useAuth'
import authMiddleware from '~/middleware/auth'

type FakeUser = { id: string } | null

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn((to: unknown) => ({ __navigateTo: to })),
}))

const user = ref<FakeUser>(null)

mockNuxtImport('useSupabaseUser', () => () => user)
mockNuxtImport('navigateTo', () => navigateToMock)

function route(fullPath: string) {
  return { fullPath } as RouteLocationNormalized
}

beforeEach(() => {
  clearNuxtState()
  user.value = null
  navigateToMock.mockClear()
})

describe('middleware/auth', () => {
  it('redirects unauthenticated visitors to /?login=1 and remembers the intended path', async () => {
    const result = authMiddleware(route('/account/orders'), route('/'))

    expect(navigateToMock).toHaveBeenCalledWith('/?login=1')
    expect(result).toEqual({ __navigateTo: '/?login=1' })

    // Cookie writes flush through a Vue watcher (async); a fresh `useCookie()` call re-reads `document.cookie`.
    await nextTick()
    expect(useCookie(REDIRECT_COOKIE_KEY).value).toBe('/account/orders')
  })

  it('lets authenticated visitors through', () => {
    user.value = { id: 'u1' }

    const result = authMiddleware(route('/account/orders'), route('/'))

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
