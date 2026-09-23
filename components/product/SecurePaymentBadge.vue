<script setup lang="ts">
// Reassurance card below PurchasePanel (Chekeys mock: "Pago seguro Garantizado"). Mercado Pago is
// the sole payment gateway (useCheckout.ts PAYMENT_METHODS) — this must not list other providers
// (Visa/PayPal/etc.) as if they were separately integrated.
</script>

<template>
  <section class="glass flex flex-col gap-3 rounded-2xl p-6" aria-label="Pago seguro garantizado">
    <div>
      <h2 class="text-sm font-semibold text-white">Pago seguro garantizado</h2>
      <p class="mt-0.5 text-xs text-white/50">Procesado por Mercado Pago</p>
    </div>
    <img src="/images/brands/mercado-pago.svg" alt="Mercado Pago" width="40" height="40" class="h-10 w-10" />
  </section>
</template>
