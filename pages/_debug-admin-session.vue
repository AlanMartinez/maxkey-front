<script setup lang="ts">
// TEMP diagnostic page — remove after debugging the /admin SSR session issue.
definePageMeta({
  middleware: [
    async () => {
      const composableSession = useSupabaseSession()
      const { $supabase } = useNuxtApp() as unknown as { $supabase: { client: { auth: { getSession: () => Promise<{ data: { session: unknown } }> } } } }
      const { data } = await $supabase.client.auth.getSession()
      const state = useState<Record<string, unknown>>('debug-mw-result', () => ({}))
      state.value = {
        composableHadSession: !!composableSession.value,
        directHadSession: !!data.session,
        ranOnServer: import.meta.server,
      }
    },
  ],
})

const session = useSupabaseSession()
const user = useSupabaseUser()
const mwResult = useState<Record<string, unknown>>('debug-mw-result', () => ({}))

const info = {
  hasSession: !!session.value,
  hasUser: !!user.value,
  onServer: import.meta.server,
  middleware: mwResult.value,
}
</script>

<template>
  <pre>{{ JSON.stringify(info, null, 2) }}</pre>
</template>
