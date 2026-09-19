<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'discount' }>(), { tone: 'neutral' })

const tones = {
  neutral: 'bg-white/10 text-white/80',
  accent: 'bg-accent/20 text-accent',
  success: 'bg-success/20 text-success',
  warning: 'bg-amber-500/20 text-amber-300',
  danger: 'bg-red-500/20 text-red-300',
  // Solid fill on purpose: the discount tag is a selling point and has to pop against the dark surfaces.
  discount: 'bg-discount font-semibold text-bg',
}
</script>

<template>
  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" :class="tones[tone]">
    <slot />
  </span>
</template>
