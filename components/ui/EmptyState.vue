<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
    <h2 class="text-lg font-semibold">{{ title }}</h2>
    <p v-if="description" class="max-w-sm text-sm text-white/60">{{ description }}</p>
    <slot />
  </div>
</template>
