/** Cookie carrying the path to return to after Google sign-in (design.md §6e, §9), read+cleared by pages/auth/callback.vue. */
export const REDIRECT_COOKIE_KEY = 'nexo.redirect'

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

  const isAuthenticated = computed(() => !!user.value)
  const email = computed(() => user.value?.email ?? null)
  const displayName = computed(() => {
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
    await navigateTo('/')
  }

  return { user, isAuthenticated, email, displayName, avatarUrl, isLoginOpen, openLogin, closeLogin, signInWithGoogle, signOut }
}
