<script setup lang="ts">
defineProps<{ current: number }>()

const steps = ['Carrito', 'Tus datos', 'Pago seguro', 'Tu key']
</script>

<template>
  <!-- Phones only show the active label; numbers keep every step identifiable at ~360px. -->
  <ol aria-label="Pasos de la compra" class="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm">
    <li
      v-for="(label, i) in steps"
      :key="label"
      class="flex items-center gap-2"
      :aria-current="i === current ? 'step' : undefined"
      :data-state="i < current ? 'done' : i === current ? 'active' : 'todo'"
    >
      <span
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold"
        :class="i < current ? 'border-success/60 bg-success/15 text-success' : i === current ? 'border-accent bg-accent/15 text-white' : 'border-white/15 text-white/40'"
      >
        <svg v-if="i < current" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
        <template v-else>{{ i + 1 }}</template>
      </span>
      <span :class="i === current ? 'font-medium text-white' : 'hidden text-white/50 sm:inline'">{{ label }}</span>
      <span v-if="i < steps.length - 1" class="h-px w-4 bg-white/15 sm:w-8" aria-hidden="true" />
    </li>
  </ol>
</template>
