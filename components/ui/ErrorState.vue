<script setup lang="ts">
withDefaults(defineProps<{ title?: string; detail?: string }>(), {
  title: 'Algo salió mal',
  detail: 'No pudimos cargar la información. Intenta de nuevo.',
})
</script>

<template>
  <div role="alert" class="glass flex flex-col items-center gap-3 rounded-2xl border-red-500/30 px-6 py-12 text-center">
    <h2 class="text-lg font-semibold">{{ title }}</h2>
    <p class="max-w-sm text-sm text-white/60">{{ detail }}</p>
    <slot name="retry" />
  </div>
</template>
