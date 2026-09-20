<script setup lang="ts">
import type { AdminOrderDetail, AdminOrderEventStatus, AdminOrderKeyStatus } from '~/types/api'
import { ApiError } from '~/composables/useApi'

// Order detail opened by clicking a row in the admin buyers table: order data, payment, per-item
// assigned keys (id/status/timestamps — never a code) and the outbox event history. Read-only except
// for one action: items the auto-assign left short get an inline "Cargar key" form so the admin can
// paste a code by hand. Same Teleport + glass dialog pattern as DeliverOrderDialog.vue.
const props = defineProps<{
  orderId: string
  detail: AdminOrderDetail | null
  status: 'idle' | 'pending' | 'success' | 'error'
  error: ApiError | null
  /** Per-itemId in-flight flag for the manual key attach, owned by useAdminOrderDetail. */
  attaching: Record<string, boolean>
}>()
const emit = defineEmits<{ close: []; retry: []; attach: [itemId: string, code: string]; deliver: [] }>()

// Draft code per itemId. Emits aren't awaited, so success is detected from the outside in: the parent
// refetches `detail` after a successful attach, and any item whose key count grew gets its draft
// cleared. A failed attach (toast from the composable) keeps the pasted code so it can be retried.
const codes = ref<Record<string, string>>({})
watch(
  () => props.detail,
  (next, prev) => {
    if (!next) return
    for (const item of next.items) {
      const before = prev?.items.find((it) => it.itemId === item.itemId)?.keys.length ?? 0
      if (item.keys.length > before) codes.value[item.itemId] = ''
    }
  },
)

function submitAttach(itemId: string) {
  if (props.attaching[itemId]) return
  emit('attach', itemId, codes.value[itemId] ?? '')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

const keyTone: Record<AdminOrderKeyStatus, 'accent' | 'success'> = { Assigned: 'accent', Revealed: 'success' }
const keyLabel: Record<AdminOrderKeyStatus, string> = { Assigned: 'Asignada', Revealed: 'Revelada' }

const eventTone: Record<AdminOrderEventStatus, 'neutral' | 'accent' | 'success' | 'danger'> = {
  Pending: 'neutral',
  Processing: 'accent',
  Processed: 'success',
  Failed: 'danger',
}
const eventLabel: Record<AdminOrderEventStatus, string> = {
  Pending: 'Pendiente',
  Processing: 'Procesando',
  Processed: 'Procesado',
  Failed: 'Falló',
}
// Outbox event types are free strings server-side; map the known ones to admin-facing copy and fall
// back to the raw type for anything new so nothing is silently hidden.
const eventTypeLabel: Record<string, string> = {
  OrderApproved: 'Pago aprobado',
  OrderDelivered: 'Pedido entregado',
  OrderDeliveryResendRequested: 'Reenvío de email solicitado',
}

// The outbox is a dispatch queue, not an audit log, so reveals never show up in `events`. The history
// merges them in client-side from keys[].revealedAt — that's the dispute evidence the admin looks for.
interface TimelineEntry {
  id: string
  label: string
  at: string
  tone: 'neutral' | 'accent' | 'success' | 'danger'
  badge: string
  meta: string | null
  error: string | null
}
const timeline = computed<TimelineEntry[]>(() => {
  if (!props.detail) return []
  const entries: TimelineEntry[] = props.detail.events.map((ev) => ({
    id: ev.id,
    label: eventTypeLabel[ev.type] ?? ev.type,
    at: ev.createdAt,
    tone: eventTone[ev.status],
    badge: eventLabel[ev.status],
    meta: [ev.processedAt ? `procesado ${formatDateTime(ev.processedAt)}` : null, ev.attempts > 1 ? `${ev.attempts} intentos` : null].filter(Boolean).join(' · ') || null,
    error: ev.lastError,
  }))
  for (const item of props.detail.items) {
    for (const key of item.keys) {
      if (!key.revealedAt) continue
      entries.push({
        id: `reveal-${key.keyId}`,
        label: `Key revelada · ${item.productName}`,
        at: key.revealedAt,
        tone: 'success',
        badge: 'Comprador',
        meta: `key ${key.keyId.slice(0, 8)}${key.revealedBy ? ` · usuario ${key.revealedBy.slice(0, 8)}` : ''}`,
        error: null,
      })
    }
  }
  return entries.sort((a, b) => a.at.localeCompare(b.at))
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="emit('close')" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        class="glass relative flex max-h-[88vh] w-full max-w-2xl flex-col gap-5 overflow-y-auto rounded-2xl p-6"
      >
        <button
          type="button"
          aria-label="Cerrar"
          class="absolute right-3 top-3 rounded-xl p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
          @click="emit('close')"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div class="flex flex-col gap-1 pr-8">
          <h2 id="order-detail-title" class="flex flex-wrap items-center gap-2 text-lg font-semibold">
            Pedido <span class="font-mono text-base text-white/70">{{ orderId.slice(0, 8) }}</span>
            <OrderStatusBadge v-if="detail" :status="detail.status" />
            <!-- Same gate as the table's "Entregar": only once every key is assigned. The parent opens
                 the usual confirmation dialog on top, since delivering emails the buyer. -->
            <AppButton
              v-if="detail?.status === 'KeysAssigned'"
              type="button"
              variant="success"
              size="sm"
              data-testid="detail-deliver"
              @click="emit('deliver')"
            >
              Entregar
            </AppButton>
          </h2>
          <p v-if="detail" class="text-sm text-white/60">{{ detail.buyerEmail }}</p>
        </div>

        <div v-if="status === 'pending'" class="flex flex-col gap-3">
          <Skeleton class="h-20 w-full" />
          <Skeleton class="h-24 w-full" />
          <Skeleton class="h-24 w-full" />
        </div>

        <ErrorState v-else-if="status === 'error'" :detail="error?.friendlyMessage()">
          <template #retry><AppButton variant="ghost" size="sm" @click="emit('retry')">Reintentar</AppButton></template>
        </ErrorState>

        <template v-else-if="detail">
          <!-- Order + payment data -->
          <dl class="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm sm:grid-cols-3">
            <div><dt class="text-xs text-white/50">Total</dt><dd class="font-medium">{{ formatMoney(detail.totalAmount, detail.currency) }}</dd></div>
            <div><dt class="text-xs text-white/50">Creado</dt><dd>{{ formatDateTime(detail.createdAt) }}</dd></div>
            <div><dt class="text-xs text-white/50">Pagado</dt><dd>{{ formatDateTime(detail.paidAt) }}</dd></div>
            <div><dt class="text-xs text-white/50">Entregado</dt><dd>{{ formatDateTime(detail.deliveredAt) }}</dd></div>
            <div><dt class="text-xs text-white/50">Última actualización</dt><dd>{{ formatDateTime(detail.updatedAt) }}</dd></div>
            <div><dt class="text-xs text-white/50">ID completo</dt><dd class="truncate font-mono text-xs text-white/70" :title="detail.id">{{ detail.id }}</dd></div>
            <div><dt class="text-xs text-white/50">Pago MP</dt><dd class="truncate font-mono text-xs text-white/70" :title="detail.mpPaymentId ?? undefined">{{ detail.mpPaymentId ?? '—' }}</dd></div>
            <div><dt class="text-xs text-white/50">Último intento</dt><dd>{{ detail.lastPaymentAttemptStatus ?? '—' }}</dd></div>
            <div><dt class="text-xs text-white/50">Intento el</dt><dd>{{ formatDateTime(detail.lastPaymentAttemptAt) }}</dd></div>
          </dl>

          <!-- Items + keys -->
          <section class="flex flex-col gap-3">
            <h3 class="text-xs font-medium uppercase tracking-wide text-white/50">Items y keys</h3>
            <div v-for="item in detail.items" :key="item.itemId" class="rounded-xl border border-white/10 bg-white/5 p-4">
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <p class="text-sm font-medium">
                  {{ item.productName }} <span class="text-white/50">— {{ item.variantName }}</span>
                </p>
                <p class="text-xs text-white/60">
                  {{ item.quantity }} × {{ formatMoney(item.unitPrice, detail.currency) }} ·
                  <span :class="item.keys.length >= item.quantity ? 'text-success' : 'text-amber-300'">{{ item.keys.length }}/{{ item.quantity }} asignada(s)</span>
                </p>
              </div>
              <ul v-if="item.keys.length" class="mt-3 flex flex-col divide-y divide-white/5 text-xs">
                <li v-for="key in item.keys" :key="key.keyId" class="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5">
                  <span class="font-mono text-white/60">{{ key.keyId.slice(0, 8) }}</span>
                  <AppBadge :tone="keyTone[key.status]">{{ keyLabel[key.status] }}</AppBadge>
                  <span class="text-white/50">asignada {{ formatDateTime(key.assignedAt) }}</span>
                  <span v-if="key.revealedAt" class="text-white/50" :title="key.revealedBy ? `Usuario ${key.revealedBy}` : undefined">· revelada {{ formatDateTime(key.revealedAt) }}</span>
                </li>
              </ul>
              <p v-else class="mt-2 text-xs text-white/40">Sin keys asignadas todavía.</p>
              <form
                v-if="item.keys.length < item.quantity"
                class="mt-3 flex flex-wrap items-center gap-2"
                :data-attach-form="item.itemId"
                @submit.prevent="submitAttach(item.itemId)"
              >
                <label class="min-w-[200px] flex-1">
                  <span class="sr-only">Código de la key para {{ item.productName }}</span>
                  <input
                    v-model="codes[item.itemId]"
                    type="text"
                    placeholder="Código de la key"
                    autocomplete="off"
                    spellcheck="false"
                    :disabled="attaching[item.itemId]"
                    class="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-sm text-white outline-none focus:border-accent disabled:opacity-50"
                  />
                </label>
                <AppButton type="submit" size="sm" :loading="attaching[item.itemId] ?? false">Cargar key</AppButton>
              </form>
            </div>
          </section>

          <!-- Event history -->
          <section class="flex flex-col gap-3">
            <h3 class="text-xs font-medium uppercase tracking-wide text-white/50">Historial</h3>
            <ol v-if="timeline.length" class="flex flex-col gap-2">
              <li v-for="entry in timeline" :key="entry.id" class="flex gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-medium">{{ entry.label }}</span>
                    <AppBadge :tone="entry.tone">{{ entry.badge }}</AppBadge>
                  </div>
                  <p class="text-xs text-white/50">
                    {{ formatDateTime(entry.at) }}
                    <template v-if="entry.meta"> · {{ entry.meta }}</template>
                  </p>
                  <p v-if="entry.error" class="truncate text-xs text-red-300" :title="entry.error">{{ entry.error }}</p>
                </div>
              </li>
            </ol>
            <p v-else class="text-xs text-white/40">Sin eventos registrados.</p>
          </section>
        </template>
      </div>
    </div>
  </Teleport>
</template>
