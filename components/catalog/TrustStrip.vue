<script setup lang="ts">
// Mirrors the "TRUST BAR" block of the Chekeys mock: three centered reassurance items.
const items = [
  { label: 'Entrega instantánea', icon: 'bolt' },
  { label: 'Keys 100% verificadas', icon: 'shield' },
  { label: 'Pago 100% seguro', icon: 'lock' },
] as const
</script>

<template>
  <div class="flex justify-center">
    <!-- Phones: one row of three stacked icon+label cells so the strip never wraps to a second line. -->
    <ul class="grid w-full grid-cols-3 justify-center gap-x-2 text-[11px] leading-tight text-white/60 sm:flex sm:w-auto sm:flex-wrap sm:gap-x-10 sm:gap-y-3 sm:text-sm" aria-label="Garantías">
      <li v-for="item in items" :key="item.label" class="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-2 sm:text-left">
        <svg class="h-4 w-4 shrink-0 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path v-if="item.icon === 'bolt'" d="M13 3L4 14h6l-1 7 9-11h-6z" />
          <template v-else-if="item.icon === 'shield'">
            <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" />
            <path d="M9 12l2 2 4-4" />
          </template>
          <template v-else>
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </template>
        </svg>
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>
