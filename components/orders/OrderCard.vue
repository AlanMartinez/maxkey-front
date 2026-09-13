<script setup lang="ts">
import type { OrderSummaryDto } from '~/types/api'

const props = defineProps<{ order: OrderSummaryDto }>()
</script>

<template>
  <NuxtLink :to="`/account/orders/${props.order.id}`" class="glass flex flex-col gap-3 rounded-2xl p-4 transition hover:border-accent/50">
    <div class="flex items-center justify-between gap-3">
      <span class="font-mono text-xs text-white/50">#{{ order.id.slice(0, 8) }}</span>
      <OrderStatusBadge :status="order.status" />
    </div>
    <p class="text-sm text-white/60">
      {{ new Date(order.createdAt).toLocaleDateString('es-AR') }} · {{ order.itemCount }} producto{{ order.itemCount === 1 ? '' : 's' }}
    </p>
    <div class="mt-auto flex items-center justify-between gap-3">
      <span class="text-lg font-semibold">{{ formatMoney(order.totalAmount, order.currency) }}</span>
      <span class="text-sm text-accent">Ver detalle</span>
    </div>
  </NuxtLink>
</template>
