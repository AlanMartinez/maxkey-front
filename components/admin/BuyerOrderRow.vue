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
  assigning: Record<string, boolean>
  assignError: Record<string, ApiError | null>
  assignIncomplete: Record<string, string | null>
}>()
// `deliver` only asks the page to open the confirmation modal (DeliverOrderDialog); the row itself
// never fires the delivery call. Assign is one-click, no confirmation step. `open` fires on a click
// anywhere on the row (action buttons stop propagation) so the page can open OrderDetailDialog.
const emit = defineEmits<{ resend: [orderId: string]; assign: [orderId: string]; deliver: [orderId: string]; open: [orderId: string] }>()

// One action per status (see buyerOrderAction in utils/orders.ts), each with its own button colour:
// Asignar = accent, Entregar = success, Reenviar = ghost.
const action = computed(() => buyerOrderAction(props.order.status))

// Per-item breakdown: an order only becomes deliverable once EVERY item has all its keys assigned,
// so the row shows each item's assigned/quantity instead of an order-wide sum that hides which
// item is still short. Defensive `?? 0` against a backend response missing a field (observed against
// the local dev API) so a stale/partial row never renders "NaN".
const itemRows = computed(() =>
  props.order.items.map((i) => {
    const quantity = i.quantity ?? 0
    const assigned = i.assignedKeys ?? 0
    return {
      label: `${i.productName} × ${quantity}`,
      title: `${i.productName} — ${i.variantName} × ${quantity} · ${assigned}/${quantity} asignada(s), ${i.revealedKeys ?? 0} revelada(s)`,
      assigned,
      quantity,
      complete: quantity > 0 && assigned >= quantity,
    }
  }),
)

// Status/outcome feedback lives in the Estado column (the composable patches order.status locally on
// success), so the actions cell only ever shows the button plus errors — nothing stacks under it.
const actionError = computed(() => {
  const id = props.order.id
  return props.assignError[id] ?? props.resendError[id] ?? null
})

// Resend isn't wired up yet (backend outbox handler pending), so the button renders disabled rather
// than hidden: the admin still sees that the action exists for Delivered orders.
const resendAvailable = false
</script>

<template>
  <tr
    class="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03] last:border-0"
    :title="`Ver detalle del pedido ${order.id.slice(0, 8)}`"
    @click="emit('open', order.id)"
  >
    <td class="whitespace-nowrap px-3 py-2 text-sm">{{ email }}</td>
    <td class="whitespace-nowrap px-3 py-2 font-mono text-xs text-white/60">{{ order.id.slice(0, 8) }}</td>
    <td class="whitespace-nowrap px-3 py-2"><OrderStatusBadge :status="order.status" /></td>
    <td class="whitespace-nowrap px-3 py-2 text-sm">{{ order.totalAmount }} {{ order.currency }}</td>
    <!-- Chips shrink (label truncates, count stays) so a multi-item order still fits one line. -->
    <td class="px-3 py-2 text-sm">
      <div class="flex max-w-[360px] items-center gap-1.5">
        <span
          v-for="(item, i) in itemRows"
          :key="i"
          :title="item.title"
          class="inline-flex min-w-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs"
          :class="item.complete ? 'border-success/30 bg-success/10 text-success' : 'border-white/10 bg-white/5 text-white/70'"
        >
          <span class="min-w-0 truncate">{{ item.label }}</span>
          <span class="shrink-0 font-mono" :class="item.complete ? 'text-success' : 'text-white/50'">{{ item.assigned }}/{{ item.quantity }}</span>
        </span>
      </div>
    </td>
    <td class="whitespace-nowrap px-3 py-2">
      <div class="flex items-center gap-2">
        <AppButton v-if="action === 'assign'" type="button" size="sm" :loading="assigning[order.id]" @click.stop="emit('assign', order.id)">Asignar keys</AppButton>
        <AppButton v-else-if="action === 'deliver'" type="button" variant="success" size="sm" @click.stop="emit('deliver', order.id)">Entregar</AppButton>
        <span v-else-if="action === 'resend'" title="Próximamente" @click.stop>
          <AppButton type="button" variant="ghost" size="sm" :disabled="!resendAvailable" :loading="resending[order.id]" @click="emit('resend', order.id)">Reenviar email</AppButton>
        </span>
        <span v-else class="text-xs text-white/40">—</span>

        <AppBadge v-if="action === 'assign' && assignIncomplete[order.id]" tone="warning" :title="assignIncomplete[order.id]">Sin stock</AppBadge>
        <span v-if="actionError" role="alert" class="max-w-[200px] truncate text-xs text-red-300" :title="actionError.friendlyMessage()">{{ actionError.friendlyMessage() }}</span>
      </div>
    </td>
  </tr>
</template>
