<script setup lang="ts">
import type { AdminBuyer } from '~/types/api'
import { ApiError } from '~/composables/useApi'

// Presentational (admin-buyers spec: Buyer Listing Grouped By Email, Key Exposure in Buyer View — only
// `assignedKeys` counts are rendered, never a key code). Resend state lives in the parent's
// `useAdminBuyers()` so multiple cards/orders can resend independently.
const props = defineProps<{
  buyer: AdminBuyer
  resending: Record<string, boolean>
  resendError: Record<string, ApiError | null>
  resendSuccess: Record<string, boolean>
}>()
const emit = defineEmits<{ resend: [orderId: string] }>()

// Inline confirm step instead of a browser `confirm()` dialog: first click asks, second click sends.
const confirmingOrderId = ref<string | null>(null)

function askConfirm(orderId: string) {
  confirmingOrderId.value = orderId
}
function cancelConfirm() {
  confirmingOrderId.value = null
}
function confirmResend(orderId: string) {
  confirmingOrderId.value = null
  emit('resend', orderId)
}
</script>

<template>
  <article class="glass flex flex-col gap-4 rounded-2xl p-5">
    <header class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="text-lg font-semibold">{{ buyer.email }}</h2>
      <span class="text-xs text-white/50">{{ buyer.orderCount }} pedido(s)</span>
    </header>

    <div v-for="order in buyer.orders" :key="order.id" class="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span>Pedido <span class="text-white/60">{{ order.id.slice(0, 8) }}</span> · {{ order.status }}</span>
        <span class="text-white/60">{{ order.totalAmount }} {{ order.currency }}</span>
      </div>
      <ul class="mt-2 flex flex-col gap-1 text-white/70">
        <li v-for="(item, i) in order.items" :key="i">
          {{ item.productName }} — {{ item.variantName }} × {{ item.quantity }} ({{ item.assignedKeys }} clave(s) asignada(s))
        </li>
      </ul>

      <div v-if="order.status === 'Delivered'" class="mt-3 flex flex-wrap items-center gap-2">
        <template v-if="confirmingOrderId === order.id">
          <span class="text-xs text-white/70">¿Reenviar el email de entrega?</span>
          <AppButton type="button" size="sm" :loading="resending[order.id]" @click="confirmResend(order.id)">Confirmar</AppButton>
          <AppButton type="button" variant="ghost" size="sm" @click="cancelConfirm()">Cancelar</AppButton>
        </template>
        <AppButton v-else type="button" variant="ghost" size="sm" @click="askConfirm(order.id)">Reenviar email de entrega</AppButton>
        <span v-if="resendSuccess[order.id]" class="text-xs text-emerald-300">Email reenviado.</span>
        <span v-if="resendError[order.id]" role="alert" class="text-xs text-red-300">{{ resendError[order.id]?.detail ?? resendError[order.id]?.title }}</span>
      </div>
    </div>
  </article>
</template>
