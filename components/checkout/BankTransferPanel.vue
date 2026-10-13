<script setup lang="ts">
import type { BankTransferDetails } from '~/types/api'
import { DELIVERY_INLINE } from '~/utils/promises'

// Destination account shown once "Transferencia bancaria" is selected. The amount is the cart subtotal:
// the server recomputes the order total from the same prices, so the buyer must transfer exactly this.
// Alias copy uses the same 1.5s "copied" feedback as CopyableValue.vue / KeyReveal.vue.
const props = defineProps<{ details: BankTransferDetails; amount: number; currency?: string }>()

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
onUnmounted(() => clearTimeout(copiedTimer))

async function copyAlias() {
  await navigator.clipboard.writeText(props.details.alias)
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <section class="glass flex flex-col gap-4 rounded-2xl p-6" data-bank-transfer>
    <h2 class="text-lg font-semibold">Datos para transferir</h2>
    <p class="text-sm text-white/60">Tenés que transferir el monto exacto a esta cuenta. Cuando lo hagas, tocá «Ya transferí».</p>
    <dl class="flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm">
      <div class="flex items-center justify-between gap-4 py-3">
        <dt class="text-white/60">Monto</dt>
        <dd class="text-lg font-bold" data-transfer-amount>{{ formatMoney(amount, currency) }}</dd>
      </div>
      <div class="flex items-center justify-between gap-4 py-3">
        <dt class="text-white/60">Alias</dt>
        <dd class="flex min-w-0 items-center gap-2">
          <span class="min-w-0 truncate font-mono font-medium" data-transfer-alias>{{ details.alias }}</span>
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-xs transition hover:bg-white/10"
            :class="copied ? 'border-success/40 text-success' : 'border-white/15 text-white/70 hover:text-white'"
            :aria-label="copied ? 'Copiado' : 'Copiar alias'"
            @click="copyAlias"
          >
            <svg v-if="copied" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
            <svg v-else class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
            {{ copied ? 'Copiado' : 'Copiar' }}
          </button>
        </dd>
      </div>
      <div class="flex items-center justify-between gap-4 py-3">
        <dt class="text-white/60">Titular</dt>
        <dd class="text-right font-medium">{{ details.accountHolder }}</dd>
      </div>
      <div v-if="details.cbu" class="flex items-center justify-between gap-4 py-3">
        <dt class="text-white/60">CBU/CVU</dt>
        <dd class="min-w-0 truncate font-mono text-xs text-white/80" :title="details.cbu">{{ details.cbu }}</dd>
      </div>
    </dl>
    <p class="text-xs text-white/50">Validamos la transferencia a mano. Apenas la confirmemos, te llega la key {{ DELIVERY_INLINE }}.</p>
  </section>
</template>
