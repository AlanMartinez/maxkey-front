<script setup lang="ts">
import type { OrderStatus, OrderStatusResponse } from '~/types/api'
import { LAST_ORDER_STORAGE_KEY } from '~/composables/useCheckout'

const POLL_INTERVAL_MS = 3000
const POLL_MAX_TRIES = 20
type Outcome = 'approved' | 'pending' | 'rejected' | 'unknown'

useHead({ title: 'Resultado del pago · CHEKEYS' })

const route = useRoute()
const api = useApi()
const cart = useCart()

// Mercado Pago back_urls carry `status=approved|failure|pending` (design §6a); anything else counts as pending.
const mpStatus = computed(() => {
  const value = route.query.status
  return value === 'approved' || value === 'failure' || value === 'rejected' ? value : 'pending'
})
const orderId = ref<string | null>(null)
const order = ref<OrderStatusResponse | null>(null)
const exhausted = ref(false)
const missing = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let tries = 0

// Every status past `Paid` (AwaitingFulfillment, KeysAssigned, Delivered) is only reachable once payment settled.
const PAID_STATUSES: ReadonlySet<OrderStatus> = new Set(['Paid', 'AwaitingFulfillment', 'KeysAssigned', 'Delivered'])

const outcome = computed<Outcome>(() => {
  if (missing.value) return 'unknown'
  const status = order.value?.status
  if (status === 'Cancelled') return 'rejected'
  if (status && PAID_STATUSES.has(status)) return 'approved'
  if (mpStatus.value === 'failure' || mpStatus.value === 'rejected' || ['rejected', 'cancelled'].includes(order.value?.lastPaymentAttemptStatus ?? '')) return 'rejected'
  return 'pending'
})

const copy: Record<Outcome, { title: string; detail: string }> = {
  approved: { title: 'Pago aprobado', detail: 'Tu pago fue confirmado. En unos minutos podrás revelar tu key. También te enviaremos un email con los pasos.' },
  pending: { title: 'Pago pendiente', detail: 'Estamos confirmando tu pago con Mercado Pago. Te avisamos por email cuando se acredite.' },
  rejected: { title: 'Pago rechazado', detail: 'Mercado Pago no aprobó el pago. Tu pedido sigue disponible: podés reintentar el pago.' },
  unknown: { title: 'No encontramos tu pedido', detail: 'Si ya pagaste, vas a recibir un email con la confirmación.' },
}

async function poll() {
  if (!orderId.value) return
  tries += 1
  try {
    order.value = await api<OrderStatusResponse>(`/checkout/orders/${orderId.value}/status`)
  } catch {
    // Transient failures are retried on the next tick; the outcome falls back to the MP query status.
  }
  if (order.value && order.value.status !== 'Pending') return
  if (tries >= POLL_MAX_TRIES) {
    exhausted.value = true
    return
  }
  timer = setTimeout(poll, POLL_INTERVAL_MS)
}

async function reconcile() {
  if (!orderId.value) return
  try {
    await api(`/checkout/orders/${orderId.value}/reconcile`, { method: 'POST' })
  } catch {
    // The regular poll keeps waiting when Mercado Pago or the API is temporarily unavailable.
  }
}

// The cart is cleared once, only when payment is known to be settled (design §9); a rejected or cancelled order keeps it for retry.
let cartCleared = false
watch(order, (value) => {
  if (cartCleared || !value || !PAID_STATUSES.has(value.status)) return
  cartCleared = true
  cart.clear()
})
onMounted(async () => {
  const fromQuery = route.query.orderId
  orderId.value = (typeof fromQuery === 'string' && fromQuery) || sessionStorage.getItem(LAST_ORDER_STORAGE_KEY)
  missing.value = !orderId.value
  await reconcile()
  poll()
})
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <section class="glass mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center" :aria-busy="outcome === 'pending' && !exhausted">
    <span v-if="outcome === 'pending' && !exhausted" class="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
    <span v-else-if="outcome === 'approved'" class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-2xl font-bold text-emerald-400" aria-label="Pago aprobado">✓</span>
    <h1 class="text-2xl font-bold">{{ copy[outcome].title }}</h1>
    <p class="max-w-sm text-sm text-white/60">{{ copy[outcome].detail }}</p>
    <p v-if="order" class="text-xs text-white/40">
      {{ formatMoney(order.totalAmount, order.currency) }} · {{ order.buyerEmailMasked }}
    </p>
    <div class="mt-2 flex flex-wrap justify-center gap-3">
      <NuxtLink v-if="outcome === 'rejected'" to="/checkout"><AppButton>Reintentar</AppButton></NuxtLink>
      <!-- /account/orders is delivered in the auth slice (PR17). -->
      <NuxtLink v-if="outcome === 'approved'" to="/account/orders"><AppButton variant="ghost">Mis compras</AppButton></NuxtLink>
      <NuxtLink to="/"><AppButton variant="ghost">Volver al catálogo</AppButton></NuxtLink>
    </div>
  </section>
</template>
