import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { clearNuxtState, useCookie } from '#app'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { REDIRECT_COOKIE_KEY, useAuth } from '~/composables/useAuth'

type FakeUser = { id: string; email?: string; user_metadata?: Record<string, unknown> } | null

const { signInWithOAuth, signOut, navigateToMock } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn<(args: { provider: string; options: { redirectTo: string } }) => Promise<{ data: object; error: null }>>(async () => ({ data: {}, error: null })),
  signOut: vi.fn(async () => ({ error: null })),
  navigateToMock: vi.fn(async (to: unknown) => to),
}))

const user = ref<FakeUser>(null)

mockNuxtImport('useSupabaseUser', () => () => user)
mockNuxtImport('useSupabaseClient', () => () => ({ auth: { signInWithOAuth, signOut } }))
mockNuxtImport('navigateTo', () => navigateToMock)

beforeEach(() => {
  clearNuxtState()
  user.value = null
  signInWithOAuth.mockClear()
  signOut.mockClear()
  navigateToMock.mockClear()
})

describe('useAuth', () => {
  it('derives isAuthenticated, email, displayName and avatarUrl from the Supabase user', () => {
    const auth = useAuth()

    expect(auth.isAuthenticated.value).toBe(false)
    expect(auth.email.value).toBeNull()
    expect(auth.displayName.value).toBeNull()

    user.value = { id: 'u1', email: 'buyer@example.com', user_metadata: { full_name: 'Buyer One', avatar_url: 'https://x/a.png' } }

    expect(auth.isAuthenticated.value).toBe(true)
    expect(auth.email.value).toBe('buyer@example.com')
    expect(auth.displayName.value).toBe('Buyer One')
    expect(auth.avatarUrl.value).toBe('https://x/a.png')
  })

  it('signs in with Google, storing the redirect cookie and pointing redirectTo at /auth/callback', async () => {
    const auth = useAuth()

    await auth.signInWithGoogle('/account/orders')

    expect(signInWithOAuth).toHaveBeenCalledTimes(1)
    const call = signInWithOAuth.mock.calls[0]?.[0]
    expect(call?.provider).toBe('google')
    expect(call?.options.redirectTo.endsWith('/auth/callback')).toBe(true)

    expect(useCookie(REDIRECT_COOKIE_KEY).value).toBe('/account/orders')
  })

  it('falls back to the current route when no redirect path is given', async () => {
    const auth = useAuth()

    await auth.signInWithGoogle()

    expect(useCookie(REDIRECT_COOKIE_KEY).value).toBe('/')
  })

  it('signs out of Supabase and navigates home', async () => {
    const auth = useAuth()

    await auth.signOut()

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(navigateToMock).toHaveBeenCalledWith('/')
  })
})
