<script setup lang="ts">
import type { OrderSummaryDto } from '~/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Mis compras · Chekeys' })

// orders-history spec: My Orders Listing (owner-scoped; anonymous access rejected by the auth middleware/API).
const api = useApi()
const { data: orders, status, error, refresh } = await useAsyncData('my-orders', () => api<OrderSummaryDto[]>('/me/orders'))
</script>

<template>
  <section class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Mis compras</h1>

    <div v-if="status === 'pending'" class="grid gap-4 sm:grid-cols-2">
      <Skeleton v-for="n in 4" :key="n" class="h-32 w-full" />
    </div>
    <ErrorState v-else-if="error">
      <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
    </ErrorState>
    <EmptyState v-else-if="!orders?.length" title="Todavía no tenés compras" description="Cuando compres con esta cuenta, tus órdenes y keys van a aparecer acá.">
      <NuxtLink to="/"><AppButton variant="ghost">Ver catálogo</AppButton></NuxtLink>
    </EmptyState>
    <div v-else class="grid gap-4 sm:grid-cols-2">
      <OrderCard v-for="order in orders" :key="order.id" :order="order" />
    </div>
  </section>
</template>
