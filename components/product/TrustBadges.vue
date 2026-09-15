<script setup lang="ts">
// Reassurance lines of the purchase card in the Chekeys mock.
const badges = [
  { label: 'Entrega automática en minutos', icon: 'bolt' },
  { label: 'Garantía de reembolso 24h', icon: 'shield' },
  { label: 'Soporte humano 24/7', icon: 'clock' },
] as const
</script>

<template>
  <ul class="flex flex-col gap-3 text-sm text-white/60">
    <li v-for="badge in badges" :key="badge.label" class="flex items-center gap-2.5">
      <svg class="h-4 w-4 shrink-0 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path v-if="badge.icon === 'bolt'" d="M13 3L4 14h6l-1 7 9-11h-6z" />
        <template v-else-if="badge.icon === 'shield'">
          <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </template>
        <template v-else>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l3 2" />
        </template>
      </svg>
      {{ badge.label }}
    </li>
  </ul>
</template>
