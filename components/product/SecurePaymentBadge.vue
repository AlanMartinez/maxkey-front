<script setup lang="ts">
import { SECURE_PAYMENT } from '~/utils/promises'

// Reassurance card below PurchasePanel (Chekeys mock: "Pago seguro Garantizado"). Mercado Pago is
// the sole payment gateway (useCheckout.ts PAYMENT_METHODS) — this must not list other providers
// (Visa/PayPal/etc.) as if they were separately integrated. Copy comes from utils/promises.ts.
</script>

<template>
  <section class="glass flex flex-col gap-3 rounded-2xl p-6" :aria-label="SECURE_PAYMENT.short">
    <div>
      <h2 class="text-sm font-semibold text-white">{{ SECURE_PAYMENT.short }}</h2>
      <p class="mt-0.5 text-xs text-white/50">{{ SECURE_PAYMENT.detail }}</p>
    </div>
    <img src="/images/brands/mercado-pago.svg" alt="Mercado Pago" width="40" height="40" class="h-10 w-10" />
  </section>
</template>
