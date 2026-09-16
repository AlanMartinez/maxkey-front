import { REDIRECT_COOKIE_KEY } from '~/composables/useAuth'

/**
 * Named route middleware (design.md §9): unauthenticated visitors are sent back to the catalog with the
 * login dialog open, remembering the page they wanted so `pages/auth/callback.vue` can return them to it.
 *
 * Calls `auth.getSession()` on the shared Supabase client instead of reading `useSupabaseSession()` —
 * see `middleware/admin.ts` for why: on the first SSR navigation the reactive ref can still be `null`
 * when route middleware runs, racing the module's async session-resolution plugin.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // DEV-ONLY: skip the login gate entirely so local development never needs a real Google session.
  // `import.meta.dev` is a compile-time constant — false (and dead-code-eliminated) in production builds.
  if (import.meta.dev) return

  const redirectCookie = useCookie(REDIRECT_COOKIE_KEY, { path: '/', maxAge: 60 * 10 })
  const supabase = useSupabaseClient()

  const { data } = await supabase.auth.getSession()
  if (data.session) return

  redirectCookie.value = to.fullPath
  return navigateTo('/?login=1')
})
