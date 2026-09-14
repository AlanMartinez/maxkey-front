import { REDIRECT_COOKIE_KEY } from '~/composables/useAuth'
import { ApiError } from '~/composables/useApi'

/**
 * Named route middleware (design.md admin-dashboard D5). Meant to run after `auth` — confirms the
 * caller passes the backend's `AdminPolicy` via `GET /admin/me`, once per app instance, caching the
 * result in `useState('admin-check')`. Non-admins are redirected to `/`; a missing/expired session
 * (no user, or a 401 from the API) is sent back through the same `/?login=1` flow as `middleware/auth.ts`.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const isAdmin = useState<boolean | null>('admin-check', () => null)

  function redirectToLogin() {
    const redirect = useCookie(REDIRECT_COOKIE_KEY, { path: '/', maxAge: 60 * 10 })
    redirect.value = to.fullPath
    return navigateTo('/?login=1')
  }

  if (!user.value) return redirectToLogin()
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
