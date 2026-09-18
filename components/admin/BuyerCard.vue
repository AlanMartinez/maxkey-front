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
  assigning: Record<string, boolean>
  assignError: Record<string, ApiError | null>
  assignSuccess: Record<string, boolean>
  delivering: Record<string, boolean>
  deliverError: Record<string, ApiError | null>
  deliverSuccess: Record<string, boolean>
}>()
const emit = defineEmits<{ resend: [orderId: string]; assign: [orderId: string]; deliver: [orderId: string] }>()

// Inline confirm step instead of a browser `confirm()` dialog: first click asks, second click sends.
// One shared slot per card (not per-action) since only one action is confirmed at a time per order.
type OrderAction = 'resend' | 'assign' | 'deliver'
const confirmingAction = ref<{ orderId: string; action: OrderAction } | null>(null)

function isConfirming(orderId: string, action: OrderAction) {
  return confirmingAction.value?.orderId === orderId && confirmingAction.value?.action === action
}
function askConfirm(orderId: string, action: OrderAction) {
  confirmingAction.value = { orderId, action }
}
function cancelConfirm() {
  confirmingAction.value = null
}
function confirmAction(orderId: string, action: OrderAction) {
  confirmingAction.value = null
  // TS can't narrow `emit`'s overload from a union parameter — switch keeps each call statically typed.
  switch (action) {
    case 'resend':
      emit('resend', orderId)
      break
    case 'assign':
      emit('assign', orderId)
      break
    case 'deliver':
      emit('deliver', orderId)
      break
  }
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
          {{ item.productName }} — {{ item.variantName }} × {{ item.quantity }} ({{ item.assignedKeys }} clave(s) asignada(s), {{ item.revealedKeys }} revelada(s))
        </li>
      </ul>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <template v-if="order.status !== 'Delivered' && order.status !== 'Cancelled'">
          <template v-if="isConfirming(order.id, 'assign')">
            <span class="text-xs text-white/70">¿Reintentar la asignación de keys?</span>
            <AppButton type="button" size="sm" :loading="assigning[order.id]" @click="confirmAction(order.id, 'assign')">Confirmar</AppButton>
            <AppButton type="button" variant="ghost" size="sm" @click="cancelConfirm()">Cancelar</AppButton>
          </template>
          <AppButton v-else type="button" variant="ghost" size="sm" @click="askConfirm(order.id, 'assign')">Asignar</AppButton>
          <span v-if="assignSuccess[order.id]" class="text-xs text-emerald-300">Keys asignadas.</span>
          <span v-if="assignError[order.id]" role="alert" class="text-xs text-red-300">{{ assignError[order.id]?.detail ?? assignError[order.id]?.title }}</span>
        </template>

        <template v-if="order.status === 'KeysAssigned'">
          <template v-if="isConfirming(order.id, 'deliver')">
            <span class="text-xs text-white/70">¿Confirmar entrega del pedido?</span>
            <AppButton type="button" size="sm" :loading="delivering[order.id]" @click="confirmAction(order.id, 'deliver')">Confirmar</AppButton>
            <AppButton type="button" variant="ghost" size="sm" @click="cancelConfirm()">Cancelar</AppButton>
          </template>
          <AppButton v-else type="button" variant="ghost" size="sm" @click="askConfirm(order.id, 'deliver')">Entregar</AppButton>
          <span v-if="deliverSuccess[order.id]" class="text-xs text-emerald-300">Pedido entregado.</span>
          <span v-if="deliverError[order.id]" role="alert" class="text-xs text-red-300">{{ deliverError[order.id]?.detail ?? deliverError[order.id]?.title }}</span>
        </template>

        <template v-if="order.status === 'Delivered'">
          <template v-if="isConfirming(order.id, 'resend')">
            <span class="text-xs text-white/70">¿Reenviar el email de entrega?</span>
            <AppButton type="button" size="sm" :loading="resending[order.id]" @click="confirmAction(order.id, 'resend')">Confirmar</AppButton>
            <AppButton type="button" variant="ghost" size="sm" @click="cancelConfirm()">Cancelar</AppButton>
          </template>
          <AppButton v-else type="button" variant="ghost" size="sm" @click="askConfirm(order.id, 'resend')">Reenviar email de entrega</AppButton>
          <span v-if="resendSuccess[order.id]" class="text-xs text-emerald-300">Email reenviado.</span>
          <span v-if="resendError[order.id]" role="alert" class="text-xs text-red-300">{{ resendError[order.id]?.detail ?? resendError[order.id]?.title }}</span>
        </template>
      </div>
    </div>
  </article>
</template>
