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
 *
 * Passes the resolved access token straight into `useApi()` rather than letting it call
 * `getSession()` again: a second, independent call in the same request intermittently came back
 * without a session even right after this one succeeded, which 401'd `/admin/me` for a logged-in admin.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const isAdmin = useState<boolean | null>('admin-check', () => null)
  const redirectCookie = useCookie(REDIRECT_COOKIE_KEY, { path: '/', maxAge: 60 * 10 })
  const supabase = useSupabaseClient()

  function redirectToLogin() {
    redirectCookie.value = to.fullPath
    return navigateTo('/?login=1')
  }

  const debugCookie = useCookie<string | null>('debug-admin-mw', { path: '/', maxAge: 60 })
  const { data, error: sessionError } = await supabase.auth.getSession()
  debugCookie.value = JSON.stringify({ hasSession: !!data.session, error: sessionError?.message ?? null, isAdminCached: isAdmin.value, t: Date.now() })

  if (!data.session) return redirectToLogin()
  if (isAdmin.value === true) return
  if (isAdmin.value === false) return navigateTo('/')

  try {
    await useApi(data.session.access_token)('/admin/me')
    isAdmin.value = true
  } catch (error) {
    const apiDebug = useCookie<string | null>('debug-admin-api', { path: '/', maxAge: 60 })
    apiDebug.value = JSON.stringify({
      isApiError: error instanceof ApiError,
      status: error instanceof ApiError ? error.status : null,
      message: error instanceof Error ? error.message : String(error),
      t: Date.now(),
    })
    if (error instanceof ApiError && error.status === 401) return redirectToLogin()
    isAdmin.value = false
    return navigateTo('/')
  }
})
