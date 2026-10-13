<script setup lang="ts">
import type { OrderStatus, OrderStatusResponse } from '~/types/api'
import { LAST_ORDER_STORAGE_KEY } from '~/composables/useCheckout'
import { whatsappUrl } from '~/utils/contact'
import { DELIVERY_INLINE, DELIVERY_MAX_HOURS } from '~/utils/promises'
import { trackPurchaseOnce } from '~/utils/metaPixel'

const POLL_INTERVAL_MS = 3000
const POLL_MAX_TRIES = 20
// `transfer` = bank transfer waiting for an admin to validate it: a final screen, nothing to poll for.
type Outcome = 'approved' | 'pending' | 'transfer' | 'rejected' | 'unknown'
// `pending` splits once polling gives up: same order state, different message and no spinner.
// A rejected transfer gets its own copy (there is no Mercado Pago payment to retry).
type CopyKey = Outcome | 'exhausted' | 'transferRejected'

useHead({ title: 'Resultado del pago · Chekeys' })

const route = useRoute()
const api = useApi()
const cart = useCart()
const { isAuthenticated, openLogin } = useAuth()

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

// Bank-transfer orders never go through Mercado Pago, so they must never hit the reconcile endpoint nor
// the MP polling loop. Known from the status response, or from the hint the checkout adds to the URL.
const isTransfer = computed(() =>
  route.query.method === 'bank-transfer'
  || order.value?.paymentMethod === 'bank-transfer'
  || order.value?.status === 'AwaitingTransferValidation')

const outcome = computed<Outcome>(() => {
  if (missing.value) return 'unknown'
  const status = order.value?.status
  if (status === 'Cancelled') return 'rejected'
  if (status && PAID_STATUSES.has(status)) return 'approved'
  if (isTransfer.value) return 'transfer'
  if (mpStatus.value === 'failure' || mpStatus.value === 'rejected' || ['rejected', 'cancelled'].includes(order.value?.lastPaymentAttemptStatus ?? '')) return 'rejected'
  return 'pending'
})

const copy: Record<CopyKey, { title: string; detail: string }> = {
  approved: { title: 'Pago aprobado', detail: `Pago aprobado. Te enviamos la confirmación por email. La key te llega por email en minutos (máximo ${DELIVERY_MAX_HOURS} h) y, si iniciaste sesión, queda en Mis compras.` },
  pending: { title: 'Pago pendiente', detail: 'Estamos confirmando tu pago con Mercado Pago. Te avisamos por email cuando se acredite.' },
  exhausted: { title: 'Todavía estamos confirmando tu pago', detail: 'Mercado Pago aún no nos confirmó la acreditación. No hace falta que esperes acá: te llega un email apenas se confirme. Si querés, escribinos por WhatsApp con el número de pedido y lo revisamos.' },
  transfer: { title: 'Recibimos tu pedido', detail: `Estamos validando tu transferencia. Apenas la confirmemos, te llega la key ${DELIVERY_INLINE}. No hace falta que esperes acá.` },
  transferRejected: { title: 'No pudimos validar tu transferencia', detail: 'Tu pedido quedó cancelado. Si ya transferiste, escribinos por WhatsApp con el número de pedido y lo revisamos.' },
  rejected: { title: 'Pago rechazado', detail: 'Mercado Pago no aprobó el pago. Tu pedido sigue disponible: podés reintentar el pago.' },
  unknown: { title: 'No encontramos tu pedido', detail: 'Si ya pagaste, vas a recibir un email con la confirmación.' },
}
const copyKey = computed<CopyKey>(() => {
  if (outcome.value === 'pending' && exhausted.value) return 'exhausted'
  if (outcome.value === 'rejected' && isTransfer.value) return 'transferRejected'
  return outcome.value
})
// Guests who paid can still see their keys later by signing in with the same email.
const offerLogin = computed(() => !isAuthenticated.value && (outcome.value === 'approved' || outcome.value === 'pending' || outcome.value === 'transfer'))

const helpHref = computed(() => whatsappUrl(`Hola, necesito ayuda con mi pedido${orderId.value ? ` ${orderId.value}` : ''} en CHEKEYS`))

async function fetchStatus() {
  if (!orderId.value) return
  try {
    order.value = await api<OrderStatusResponse>(`/checkout/orders/${orderId.value}/status`)
  } catch {
    // Transient failures are retried on the next poll tick; the outcome falls back to the MP query status.
  }
}

async function poll() {
  if (!orderId.value) return
  tries += 1
  await fetchStatus()
  if (isTransfer.value || (order.value && order.value.status !== 'Pending')) return
  if (tries >= POLL_MAX_TRIES) {
    exhausted.value = true
    return
  }
  timer = setTimeout(poll, POLL_INTERVAL_MS)
}

async function reconcile() {
  if (!orderId.value || isTransfer.value) return
  try {
    // URL params only identify an order. Server re-fetches Mercado Pago and validates amount/currency before persisting approval.
    order.value = await api<OrderStatusResponse>(`/checkout/orders/${orderId.value}/reconcile`, { method: 'POST' })
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
  // Server-confirmed total, reported once per order (a reload or a later visit does not count it again).
  trackPurchaseOnce(value.orderId, value.totalAmount, value.currency)
})
onMounted(async () => {
  const fromOrderId = route.query.orderId
  const fromMercadoPago = route.query.external_reference
  orderId.value = (typeof fromOrderId === 'string' && fromOrderId)
    || (typeof fromMercadoPago === 'string' && fromMercadoPago)
    || sessionStorage.getItem(LAST_ORDER_STORAGE_KEY)
  missing.value = !orderId.value
  // Without a Mercado Pago return URL the order may be a transfer, so learn its method before any reconcile.
  // A transfer only needs that one status fetch to show its amount and state: no reconcile, no polling loop.
  if (isTransfer.value || typeof fromMercadoPago !== 'string') await fetchStatus()
  if (isTransfer.value) return
  await reconcile()
  poll()
})
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <section class="glass mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl px-6 py-10 text-center sm:py-12" :aria-busy="outcome === 'pending' && !exhausted">
    <CheckoutSteps :current="outcome === 'approved' ? 3 : 2" class="mb-4 justify-center" />
    <span v-if="outcome === 'transfer'" class="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent" aria-hidden="true" data-transfer-pending>
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    </span>
    <span v-else-if="outcome === 'pending' && !exhausted" class="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
    <span v-else-if="outcome === 'approved'" class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-2xl font-bold text-emerald-400" aria-label="Pago aprobado">✓</span>
    <h1 class="text-2xl font-bold">{{ copy[copyKey].title }}</h1>
    <p class="max-w-sm text-sm text-white/60">{{ copy[copyKey].detail }}</p>
    <div v-if="order" class="flex flex-col items-center gap-1.5 text-xs text-white/40">
      <p class="flex max-w-full items-center gap-2">
        <span>Pedido</span>
        <CopyableValue :value="order.orderId" class="max-w-[16rem] text-white/70" />
      </p>
      <p>{{ formatMoney(order.totalAmount, order.currency) }} · {{ order.buyerEmailMasked }}</p>
    </div>
    <OrderProgress v-if="outcome === 'approved' && order" :status="order.status" class="mt-2" />
    <div class="mt-2 flex flex-wrap justify-center gap-3">
      <NuxtLink v-if="outcome === 'rejected' && !isTransfer" to="/checkout"><AppButton>Reintentar</AppButton></NuxtLink>
      <template v-if="outcome === 'approved' && isAuthenticated && orderId">
        <NuxtLink :to="`/account/orders/${orderId}`"><AppButton>Ver mi pedido</AppButton></NuxtLink>
        <NuxtLink to="/"><AppButton variant="ghost">Ir al catálogo</AppButton></NuxtLink>
      </template>
      <NuxtLink v-else-if="outcome === 'approved'" to="/"><AppButton variant="ghost">Ir al catálogo</AppButton></NuxtLink>
      <NuxtLink v-else to="/"><AppButton variant="ghost">Volver al catálogo</AppButton></NuxtLink>
    </div>
    <AppButton v-if="offerLogin" variant="ghost" size="sm" class="mt-1" @click="openLogin()">Iniciar sesión con Google para ver tus keys</AppButton>
    <a :href="helpHref" target="_blank" rel="noopener" class="mt-4 text-xs text-white/50 transition hover:text-white">
      ¿Algo salió mal? Escribinos por WhatsApp
    </a>
  </section>
</template>
