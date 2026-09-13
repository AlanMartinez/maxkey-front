<script setup lang="ts">
import type { OrderStatus } from '~/types/api'

const props = defineProps<{ status: OrderStatus }>()

// design.md §9 "States": OrderStatusBadge maps the five statuses to token colors.
const copy: Record<OrderStatus, { label: string; tone: 'neutral' | 'accent' | 'success' | 'danger' }> = {
  Pending: { label: 'Pendiente de pago', tone: 'neutral' },
  Paid: { label: 'Pagado', tone: 'accent' },
  AwaitingFulfillment: { label: 'Preparando entrega', tone: 'accent' },
  Delivered: { label: 'Entregado', tone: 'success' },
  Cancelled: { label: 'Cancelado', tone: 'danger' },
}
const current = computed(() => copy[props.status])
</script>

<template>
  <AppBadge :tone="current.tone">{{ current.label }}</AppBadge>
</template>
