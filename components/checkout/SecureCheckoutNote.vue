<script setup lang="ts">
import { SECURE_PAYMENT } from '~/utils/promises'
</script>

<template>
  <div class="flex items-start gap-2.5 text-xs leading-relaxed">
    <svg class="mt-0.5 h-4 w-4 shrink-0 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
    <p class="flex flex-col gap-0.5">
      <span class="text-white/70">{{ SECURE_PAYMENT.short }}. {{ SECURE_PAYMENT.detail }}</span>
      <span class="text-white/45">Tarjetas de crédito y débito, dinero en cuenta y transferencia.</span>
    </p>
  </div>
</template>
