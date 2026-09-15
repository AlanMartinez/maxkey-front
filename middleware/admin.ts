import { REDIRECT_COOKIE_KEY } from '~/composables/useAuth'
import { ApiError } from '~/composables/useApi'

/**
 * Named route middleware (design.md admin-dashboard D5). Meant to run after `auth` — confirms the
 * caller passes the backend's `AdminPolicy` via `GET /admin/me`, once per app instance, caching the
 * result in `useState('admin-check')`. Non-admins are redirected to `/`; a missing/expired session
 * (no session, or a 401 from the API) is sent back through the same `/?login=1` flow as `middleware/auth.ts`.
 *
 * Uses `useSupabaseSession()` rather than `useSupabaseUser()`: the module's SSR user plugin resolves
 * via Supabase's `getClaims()`, which needs JWKS and fails on projects without asymmetric JWT signing
 * keys enabled — silently nulling `user.value` even with a valid session. `getSession()` only reads
 * the cookie, so it stays reliable; the real admin check still happens against `/admin/me`.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const session = useSupabaseSession()
  const isAdmin = useState<boolean | null>('admin-check', () => null)

  function redirectToLogin() {
    const redirect = useCookie(REDIRECT_COOKIE_KEY, { path: '/', maxAge: 60 * 10 })
    redirect.value = to.fullPath
    return navigateTo('/?login=1')
  }

  if (!session.value) return redirectToLogin()
  if (isAdmin.value === true) return
  if (isAdmin.value === false) return navigateTo('/')

  try {
    await useApi()('/admin/me')
    isAdmin.value = true
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return redirectToLogin()
    isAdmin.value = false
    return navigateTo('/')
  }
})
