<script setup lang="ts">
import type { OrderDetailDto, RevealKeysResponse } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { canRevealKeys } from '~/utils/orders'

definePageMeta({ middleware: 'auth' })

const id = useRoute().params.id as string
const api = useApi()

// orders-history spec: Order Detail With Conditional Key Reveal + Ownership Enforcement (404 on non-owner).
const { data: order, status, error, refresh } = await useAsyncData(`order-${id}`, () => api<OrderDetailDto>(`/me/orders/${id}`))

const httpStatus = error.value?.statusCode ?? (error.value?.cause as ApiError | undefined)?.status
if (httpStatus === 404) throw createError({ statusCode: 404, statusMessage: 'Pedido no encontrado', fatal: true })

useHead({ title: 'Detalle de compra · CHEKEYS' })

// key-delivery-gate (PR #49): decrypt-and-return is server-side, idempotent, and permanent — once
// revealed, `item.keys` holds the codes for good, so no client-side "revealed" flag needs persisting.
const revealing = reactive<Record<string, boolean>>({})
const revealError = reactive<Record<string, ApiError | null>>({})

async function reveal(itemId: string) {
  if (!order.value) return
  revealing[itemId] = true
  revealError[itemId] = null
  try {
    const result = await api<RevealKeysResponse>(`/me/orders/${id}/items/${itemId}/keys/reveal`, { method: 'POST' })
    const item = order.value.items.find((i) => i.itemId === itemId)
    if (item) item.keys = result.codes
  } catch (e) {
    revealError[itemId] = e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
  } finally {
    revealing[itemId] = false
  }
}
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
        <!-- Key visibility is per-item now (item.keys / item.revealable), not gated by order.status. -->
        <div v-if="item.keys.length" class="flex flex-col gap-2">
          <KeyReveal v-for="code in item.keys" :key="code" :code="code" />
        </div>
        <!-- Primary accent: this item's keys were never revealed. Once revealed, the codes replace the button (branch above). -->
        <div v-else-if="canRevealKeys(item)" class="flex flex-col gap-2">
          <AppButton type="button" size="sm" :loading="revealing[item.itemId]" @click="reveal(item.itemId)">Revelar key</AppButton>
          <span v-if="revealError[item.itemId]" role="alert" class="text-xs text-red-300">{{ revealError[item.itemId]?.friendlyMessage() }}</span>
        </div>
        <p v-else class="text-xs text-white/50">Tus keys aparecerán aquí cuando la orden esté entregada</p>
      </li>
    </ul>

    <p class="text-right text-lg font-semibold">{{ formatMoney(order.totalAmount, order.currency) }}</p>
  </section>
</template>
