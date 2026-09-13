<script setup lang="ts">
import type { OrderDetailDto } from '~/types/api'
import type { ApiError } from '~/composables/useApi'
import { visibleKeys } from '~/utils/orders'

definePageMeta({ middleware: 'auth' })

const id = useRoute().params.id as string
const api = useApi()

// orders-history spec: Order Detail With Conditional Key Reveal + Ownership Enforcement (404 on non-owner).
const { data: order, status, error, refresh } = await useAsyncData(`order-${id}`, () => api<OrderDetailDto>(`/me/orders/${id}`))

const httpStatus = error.value?.statusCode ?? (error.value?.cause as ApiError | undefined)?.status
if (httpStatus === 404) throw createError({ statusCode: 404, statusMessage: 'Pedido no encontrado', fatal: true })

useHead({ title: 'Detalle de compra · Nexo' })
</script>

<template>
  <Skeleton v-if="status === 'pending'" class="h-64 w-full" />
  <ErrorState v-else-if="!order">
    <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
  </ErrorState>
  <section v-else class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold">Pedido #{{ order.id.slice(0, 8) }}</h1>
        <p class="text-sm text-white/60">{{ new Date(order.createdAt).toLocaleDateString('es-AR') }}</p>
      </div>
      <OrderStatusBadge :status="order.status" />
    </header>

    <ul class="glass flex flex-col divide-y divide-white/10 rounded-2xl">
      <li v-for="(item, index) in order.items" :key="index" class="flex flex-col gap-3 p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="font-semibold">{{ item.productName }}</p>
            <p class="text-xs text-white/60">{{ item.variantName }} × {{ item.quantity }}</p>
          </div>
          <p class="text-sm font-medium">{{ formatMoney(item.unitPrice * item.quantity, order.currency) }}</p>
        </div>
        <!-- Never render key codes for a non-Delivered order, even if present in the payload. -->
        <div v-if="order.status === 'Delivered'" class="flex flex-col gap-2">
          <KeyReveal v-for="code in visibleKeys(order, item)" :key="code" :code="code" />
        </div>
        <p v-else class="text-xs text-white/50">Tus keys aparecerán aquí cuando la orden esté entregada</p>
      </li>
    </ul>

    <p class="text-right text-lg font-semibold">{{ formatMoney(order.totalAmount, order.currency) }}</p>
  </section>
</template>
