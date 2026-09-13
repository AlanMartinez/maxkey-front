<script setup lang="ts">
defineProps<{ platforms: string[] }>()
/** Selected platform; `null` means "Todos". */
const model = defineModel<string | null>({ default: null })
</script>

<template>
  <div role="group" aria-label="Plataforma" class="flex flex-wrap gap-2">
    <button
      v-for="platform in [null, ...platforms]"
      :key="platform ?? 'all'"
      type="button"
      :aria-pressed="model === platform"
      class="rounded-full border px-4 py-1.5 text-sm transition"
      :class="model === platform ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-white/70 hover:border-white/30 hover:text-white'"
      @click="model = platform"
    >
      {{ platform ?? 'Todos' }}
    </button>
  </div>
</template>
