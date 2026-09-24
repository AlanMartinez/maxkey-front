<script setup lang="ts">
import { REDIRECT_COOKIE_KEY } from '~/composables/useAuth'

// Supabase exchanges the OAuth code for a session client-side before `useSupabaseUser()` settles; give it a
// bounded window before showing a retry state instead of spinning forever.
const WAIT_TIMEOUT_MS = 8000

useHead({ title: 'Conectando… · CHEKEYS' })

const user = useSupabaseUser()
const redirect = useCookie<string | null>(REDIRECT_COOKIE_KEY, { path: '/', maxAge: 60 * 10 })
const timedOut = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let stopWatch: (() => void) | undefined

function finish() {
  stopWatch?.()
  clearTimeout(timer)
  const target = redirect.value
  redirect.value = null
  // A real browser navigation (not a client-side route push) lands the target page through its
  // normal SSR render, with the session already in the request — the already-public hero carousel
  // and catalog come back fully formed instead of flashing a loading state while this freshly-booted
  // SPA (the OAuth redirect landed here cold, nothing cached) fetches them from scratch client-side.
  navigateTo(target || '/', { external: true })
}

onMounted(() => {
  if (user.value) {
    finish()
    return
  }
  stopWatch = watch(user, (value) => {
    if (value) finish()
  })
  timer = setTimeout(() => { timedOut.value = true }, WAIT_TIMEOUT_MS)
})
onUnmounted(() => {
  stopWatch?.()
  clearTimeout(timer)
})
</script>

<template>
  <section class="glass mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center">
    <template v-if="!timedOut">
      <span class="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
      <p class="text-sm text-white/60">Conectando…</p>
    </template>
    <ErrorState v-else title="No pudimos iniciar sesión" detail="Intentá nuevamente desde el catálogo.">
      <template #retry>
        <NuxtLink to="/?login=1"><AppButton variant="ghost">Reintentar</AppButton></NuxtLink>
      </template>
    </ErrorState>
  </section>
</template>
