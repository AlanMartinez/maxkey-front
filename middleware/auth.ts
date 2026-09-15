import { REDIRECT_COOKIE_KEY } from '~/composables/useAuth'

/**
 * Named route middleware (design.md §9): unauthenticated visitors are sent back to the catalog with the
 * login dialog open, remembering the page they wanted so `pages/auth/callback.vue` can return them to it.
 *
 * Uses `useSupabaseSession()`, not `useSupabaseUser()` — see `middleware/admin.ts` for why: the SSR
 * user plugin resolves via `getClaims()` (needs JWKS) and can silently null out even with a valid session.
 */
export default defineNuxtRouteMiddleware((to) => {
  const session = useSupabaseSession()
  if (session.value) return

  const redirect = useCookie(REDIRECT_COOKIE_KEY, { path: '/', maxAge: 60 * 10 })
  redirect.value = to.fullPath
  return navigateTo('/?login=1')
})
