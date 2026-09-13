<script setup lang="ts">
const badges = ['Entrega instantánea', 'Keys 100% verificadas', 'Compra verificada']
</script>

<template>
  <ul class="grid gap-3 text-sm text-white/80 sm:grid-cols-3">
    <li v-for="badge in badges" :key="badge" class="glass flex items-center gap-2 rounded-xl px-3 py-2">
      <svg class="h-4 w-4 shrink-0 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      {{ badge }}
    </li>
  </ul>
</template>
