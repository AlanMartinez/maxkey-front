import { REDIRECT_COOKIE_KEY } from '~/composables/useAuth'

/**
 * Named route middleware (design.md §9): unauthenticated visitors are sent back to the catalog with the
 * login dialog open, remembering the page they wanted so `pages/auth/callback.vue` can return them to it.
 */
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  if (user.value) return

  const redirect = useCookie(REDIRECT_COOKIE_KEY, { path: '/', maxAge: 60 * 10 })
  redirect.value = to.fullPath
  return navigateTo('/?login=1')
})
