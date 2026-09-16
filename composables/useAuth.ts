import { ApiError } from '~/composables/useApi'

/** Cookie carrying the path to return to after Google sign-in (design.md §6e, §9), read+cleared by pages/auth/callback.vue. */
export const REDIRECT_COOKIE_KEY = 'chekeys.redirect'

/**
 * Session state and Google sign-in flow. Guests can browse and check out without an account (auth spec);
 * `isLoginOpen` is shared app-wide so `LoginDialog` (mounted once in app.vue) can be opened from anywhere.
 */
export function useAuth() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const route = useRoute()
  const config = useRuntimeConfig()

  const isLoginOpen = useState('auth-login-open', () => false)
  const watcherRegistered = useState('auth-login-watcher', () => false)

  function openLogin() { isLoginOpen.value = true }
  function closeLogin() { isLoginOpen.value = false }

  // `middleware/auth.ts` redirects to `/?login=1`; open the dialog once per app instance when that query lands.
  if (!watcherRegistered.value) {
    watcherRegistered.value = true
    if (route.query.login === '1') openLogin()
    effectScope(true).run(() => watch(() => route.query.login, (value) => { if (value === '1') openLogin() }))
  }

  // Shared with `middleware/admin.ts`, which caches `GET /admin/me` under the same key. Checked here too so
  // the admin nav link + avatar glow can light up on any page, not only after visiting an /admin/* route.
  const isAdmin = useState<boolean | null>('admin-check', () => null)
  const adminCheckWatcherRegistered = useState('admin-check-watcher', () => false)

  // DEV-ONLY: always a signed-in admin, no Google login or real admin account needed locally.
  // `import.meta.dev` is a compile-time constant — false (and dead-code-eliminated) in production builds.
  if (import.meta.dev) isAdmin.value = true

  const isAuthenticated = computed(() => import.meta.dev || !!user.value)

  async function checkAdminStatus() {
    if (isAdmin.value !== null) return
    try {
      await useApi()('/admin/me')
      isAdmin.value = true
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return
      isAdmin.value = false
    }
  }

  // Client-only: SSR would double the request (once per render pass) and the middleware already
  // covers the server-side gate on /admin/* routes.
  if (import.meta.client && !adminCheckWatcherRegistered.value) {
    adminCheckWatcherRegistered.value = true
    if (isAuthenticated.value) checkAdminStatus()
    effectScope(true).run(() => watch(isAuthenticated, (value) => { if (value) checkAdminStatus() }))
  }

  const email = computed(() => (import.meta.dev ? 'dev@localhost' : user.value?.email ?? null))
  const displayName = computed(() => {
    if (import.meta.dev) return 'Dev Admin'
    const metadata = user.value?.user_metadata as Record<string, unknown> | undefined
    return (metadata?.full_name as string | undefined) ?? (metadata?.name as string | undefined) ?? email.value
  })
  const avatarUrl = computed(() => {
    const metadata = user.value?.user_metadata as Record<string, unknown> | undefined
    return (metadata?.avatar_url as string | undefined) ?? null
  })

  /** Stores the return path, then hands off to Supabase's Google OAuth; the flow lands on `/auth/callback`. */
  async function signInWithGoogle(redirectPath?: string) {
    const redirect = useCookie(REDIRECT_COOKIE_KEY, { path: '/', maxAge: 60 * 10 })
    redirect.value = redirectPath ?? route.fullPath
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${config.public.siteUrl}/auth/callback` },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    if (!import.meta.dev) isAdmin.value = null
    await navigateTo('/')
  }

  return { user, isAuthenticated, isAdmin, email, displayName, avatarUrl, isLoginOpen, openLogin, closeLogin, signInWithGoogle, signOut }
}
