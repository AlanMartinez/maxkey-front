<script setup lang="ts">
withDefaults(
  defineProps<{ variant?: 'primary' | 'success' | 'ghost'; size?: 'sm' | 'md' | 'lg'; type?: 'button' | 'submit'; loading?: boolean; disabled?: boolean }>(),
  { variant: 'primary', size: 'md', type: 'button', loading: false, disabled: false },
)

const variants = {
  primary: 'bg-accent text-white shadow-[0_0_24px_rgba(124,92,252,0.35)] hover:bg-accent-hover',
  // Teal "completion" action (e.g. deliver an order) so it reads differently from the accent primary
  // when both sit in the same row.
  success: 'bg-success text-bg shadow-[0_0_24px_rgba(34,211,168,0.3)] hover:bg-success/90',
  ghost: 'border border-white/10 text-white/80 hover:bg-white/5 hover:text-white',
}
const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-5 text-sm', lg: 'h-12 px-6 text-base' }
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    class="inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="[variants[variant], sizes[size]]"
  >
    <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
    <slot />
  </button>
</template>
