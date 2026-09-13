<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'accent' | 'success' | 'danger' }>(), { tone: 'neutral' })

const tones = {
  neutral: 'bg-white/10 text-white/80',
  accent: 'bg-accent/20 text-accent',
  success: 'bg-success/20 text-success',
  danger: 'bg-red-500/20 text-red-300',
}
</script>

<template>
  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" :class="tones[tone]">
    <slot />
  </span>
</template>
