<script setup lang="ts">
import type { AdminBuyerOrder } from '~/types/api'
import { ApiError } from '~/composables/useApi'

// One <tr> per order (admin-buyers spec: Buyer Listing Grouped By Email + Resend Delivery Email; design
// D4 — flattened to one row per order instead of grouping, so the table scales to many buyers/orders).
// Key Exposure in Buyer View: only `assignedKeys`/`revealedKeys` counts render, never a key code.
const props = defineProps<{
  email: string
  order: AdminBuyerOrder
  resending: Record<string, boolean>
  resendError: Record<string, ApiError | null>
  resendSuccess: Record<string, boolean>
  assigning: Record<string, boolean>
  assignError: Record<string, ApiError | null>
  assignSuccess: Record<string, boolean>
  assignIncomplete: Record<string, string | null>
  delivering: Record<string, boolean>
  deliverError: Record<string, ApiError | null>
  deliverSuccess: Record<string, boolean>
}>()
const emit = defineEmits<{ resend: [orderId: string]; assign: [orderId: string]; deliver: [orderId: string] }>()

// Inline confirm step instead of a browser `confirm()` dialog: first click asks, second click sends.
type OrderAction = 'resend' | 'assign' | 'deliver'
const confirmingAction = ref<OrderAction | null>(null)

function confirmAction(action: OrderAction) {
  confirmingAction.value = null
  switch (action) {
    case 'resend':
      emit('resend', props.order.id)
      break
    case 'assign':
      emit('assign', props.order.id)
      break
    case 'deliver':
      emit('deliver', props.order.id)
      break
  }
}

const itemsSummary = computed(() => {
  // Defensive against a backend response missing a field (observed against the local dev API): a
  // stale/partial row shouldn't render "NaN" in a table meant to scale to real traffic.
  const assigned = props.order.items.reduce((sum, i) => sum + (i.assignedKeys ?? 0), 0)
  const revealed = props.order.items.reduce((sum, i) => sum + (i.revealedKeys ?? 0), 0)
  const quantity = props.order.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
  return `${quantity} item(s) · ${assigned} asignada(s), ${revealed} revelada(s)`
})
const itemsDetail = computed(() => props.order.items.map((i) => `${i.productName} — ${i.variantName} × ${i.quantity}`).join('\n'))
</script>

<template>
  <tr class="border-b border-white/5 align-top last:border-0">
    <td class="whitespace-nowrap px-3 py-3 text-sm">{{ email }}</td>
    <td class="whitespace-nowrap px-3 py-3 font-mono text-xs text-white/60">{{ order.id.slice(0, 8) }}</td>
    <td class="whitespace-nowrap px-3 py-3"><OrderStatusBadge :status="order.status" /></td>
    <td class="whitespace-nowrap px-3 py-3 text-sm">{{ order.totalAmount }} {{ order.currency }}</td>
    <td class="px-3 py-3 text-sm text-white/70" :title="itemsDetail">{{ itemsSummary }}</td>
    <td class="px-3 py-3">
      <div class="flex flex-wrap items-center gap-2">
        <template v-if="order.status !== 'Delivered' && order.status !== 'Cancelled'">
          <template v-if="confirmingAction === 'assign'">
            <span class="text-xs text-white/70">¿Reintentar asignación?</span>
            <AppButton type="button" size="sm" :loading="assigning[order.id]" @click="confirmAction('assign')">Confirmar</AppButton>
            <AppButton type="button" variant="ghost" size="sm" @click="confirmingAction = null">Cancelar</AppButton>
          </template>
          <AppButton v-else type="button" size="sm" @click="confirmingAction = 'assign'">Asignar</AppButton>
          <span v-if="assignSuccess[order.id]" class="text-xs text-success">Keys asignadas.</span>
          <AppBadge v-if="assignIncomplete[order.id]" tone="warning">{{ assignIncomplete[order.id] }}</AppBadge>
          <span v-if="assignError[order.id]" role="alert" class="text-xs text-red-300">{{ assignError[order.id]?.friendlyMessage() }}</span>
        </template>

        <template v-if="order.status === 'KeysAssigned'">
          <template v-if="confirmingAction === 'deliver'">
            <span class="text-xs text-white/70">¿Confirmar entrega?</span>
            <AppButton type="button" size="sm" :loading="delivering[order.id]" @click="confirmAction('deliver')">Confirmar</AppButton>
            <AppButton type="button" variant="ghost" size="sm" @click="confirmingAction = null">Cancelar</AppButton>
          </template>
          <AppButton v-else type="button" size="sm" @click="confirmingAction = 'deliver'">Entregar</AppButton>
          <span v-if="deliverSuccess[order.id]" class="text-xs text-success">Pedido entregado.</span>
          <span v-if="deliverError[order.id]" role="alert" class="text-xs text-red-300">{{ deliverError[order.id]?.friendlyMessage() }}</span>
        </template>

        <template v-if="order.status === 'Delivered'">
          <template v-if="confirmingAction === 'resend'">
            <span class="text-xs text-white/70">¿Reenviar email?</span>
            <AppButton type="button" size="sm" :loading="resending[order.id]" @click="confirmAction('resend')">Confirmar</AppButton>
            <AppButton type="button" variant="ghost" size="sm" @click="confirmingAction = null">Cancelar</AppButton>
          </template>
          <AppButton v-else type="button" size="sm" @click="confirmingAction = 'resend'">Reenviar email de entrega</AppButton>
          <span v-if="resendSuccess[order.id]" class="text-xs text-success">Email reenviado.</span>
          <span v-if="resendError[order.id]" role="alert" class="text-xs text-red-300">{{ resendError[order.id]?.friendlyMessage() }}</span>
        </template>
      </div>
    </td>
  </tr>
</template>
