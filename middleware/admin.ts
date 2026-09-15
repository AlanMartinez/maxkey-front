import { REDIRECT_COOKIE_KEY } from '~/composables/useAuth'
import { ApiError } from '~/composables/useApi'

/**
 * Named route middleware (design.md admin-dashboard D5). Meant to run after `auth` — confirms the
 * caller passes the backend's `AdminPolicy` via `GET /admin/me`, once per app instance, caching the
 * result in `useState('admin-check')`. Non-admins are redirected to `/`; a missing/expired session
 * (no session, or a 401 from the API) is sent back through the same `/?login=1` flow as `middleware/auth.ts`.
 *
 * Calls `auth.getSession()` on the shared Supabase client instead of reading `useSupabaseSession()`.
 * The reactive ref is only populated once the module's SSR plugin finishes an async round-trip
 * (`Promise.all([serverSupabaseSession(...), serverSupabaseUser(...)])`); on the very first SSR
 * navigation, route middleware can run before that promise settles, seeing a stale `null` even with
 * a valid session cookie. The client itself is provided synchronously at the top of the plugin, so
 * asking it directly for the session is race-free.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const isAdmin = useState<boolean | null>('admin-check', () => null)
  const redirectCookie = useCookie(REDIRECT_COOKIE_KEY, { path: '/', maxAge: 60 * 10 })
  // TEMP debug cookie -- remove once the SSR session race is confirmed/fixed.
  const debugCookie = useCookie<string | null>('debug-admin-mw', { path: '/', maxAge: 60 })
  const supabase = useSupabaseClient()

  function redirectToLogin() {
    redirectCookie.value = to.fullPath
    return navigateTo('/?login=1')
  }

  let debugInfo: Record<string, unknown> = { onServer: import.meta.server, hasClient: !!supabase }
  let session: unknown = null
  try {
    const { data, error } = await supabase.auth.getSession()
    session = data.session
    debugInfo = { ...debugInfo, hasSession: !!data.session, getSessionError: error?.message ?? null }
  } catch (error) {
    debugInfo = { ...debugInfo, threw: error instanceof Error ? error.message : String(error) }
  }
  debugCookie.value = JSON.stringify(debugInfo)

  if (!session) return redirectToLogin()
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
