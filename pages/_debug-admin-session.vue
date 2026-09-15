<script setup lang="ts">
// TEMP diagnostic page — remove after debugging the /admin SSR session issue.
const session = useSupabaseSession()
const user = useSupabaseUser()
const isAdminState = useState<boolean | null>('admin-check', () => null)

const info = {
  hasSession: !!session.value,
  hasUser: !!user.value,
  isAdminState: isAdminState.value,
  onServer: import.meta.server,
}
</script>

<template>
  <pre>{{ JSON.stringify(info, null, 2) }}</pre>
</template>
