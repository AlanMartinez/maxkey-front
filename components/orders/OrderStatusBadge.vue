<script setup lang="ts">
import type { OrderStatus } from '~/types/api'

const props = defineProps<{ status: OrderStatus }>()

// design.md §9 "States": OrderStatusBadge maps the statuses to token colors.
// KeysAssigned added by key-delivery-gate (PR #49): keys are auto-assigned but an admin still needs to
// confirm delivery, so it reads as "in progress" (accent) rather than "done" (success) like Delivered.
const copy: Record<OrderStatus, { label: string; tone: 'neutral' | 'accent' | 'success' | 'danger' }> = {
  Pending: { label: 'Pendiente de pago', tone: 'neutral' },
  Paid: { label: 'Pagado', tone: 'accent' },
  AwaitingFulfillment: { label: 'Preparando entrega', tone: 'accent' },
  KeysAssigned: { label: 'Claves asignadas', tone: 'accent' },
  Delivered: { label: 'Entregado', tone: 'success' },
  Cancelled: { label: 'Cancelado', tone: 'danger' },
}
// Unknown value (e.g. a backend response serializing the enum as a number) must degrade to a neutral
// badge: a throw here aborts the whole row's patch and leaves stale DOM (a stuck spinner) behind.
const current = computed(() => copy[props.status] ?? { label: String(props.status), tone: 'neutral' as const })
</script>

<template>
  <AppBadge :tone="current.tone">{{ current.label }}</AppBadge>
</template>
