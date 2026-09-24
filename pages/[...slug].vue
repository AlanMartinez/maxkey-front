<script setup lang="ts">
// Catch-all: any unmatched route renders the branded error.vue as a real 404 (status code included),
// instead of bouncing the buyer to an external domain.
throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
</script>

<template>
  <div />
</template>
