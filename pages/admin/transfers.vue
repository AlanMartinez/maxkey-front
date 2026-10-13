<script setup lang="ts">
import type { AdminOrder } from '~/types/api'
import type { TransferDecision } from '~/composables/useAdminTransfers'

definePageMeta({ middleware: ['auth', 'admin'] })
useHead({ title: 'Transferencias · Admin · Chekeys' })

// Bank-transfer validation queue. The admin checks the bank account for each transfer, then approves
// (the order continues exactly like a Mercado Pago-paid one) or rejects it (the order is cancelled).
const { orders, status, error, deciding, load, approve, reject } = useAdminTransfers()

await load()

function formatDateTime(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

// The list item carries no creation date or total yet (backend AdminOrderResponse), so those columns only
// render once some row actually has them, instead of a column full of "—".
const showDate = computed(() => orders.value.some((o) => o.createdAt))
const showTotal = computed(() => orders.value.some((o) => o.totalAmount !== undefined))

function formatTotal(order: AdminOrder) {
  return order.totalAmount === undefined ? '—' : formatMoney(order.totalAmount, order.currency)
}

// --- Decision confirmation ------------------------------------------------------------------------
// Both actions are irreversible (approve triggers delivery, reject cancels the order), so each goes
// through one shared ConfirmDialog on the page. On failure (error toast from the composable) the dialog
// stays open so the admin can retry or cancel.
const pendingDecision = ref<{ order: AdminOrder; decision: TransferDecision } | null>(null)

const dialogCopy = computed(() => {
  const target = pendingDecision.value
  if (!target) return null
  const who = target.order.totalAmount === undefined ? target.order.buyerEmail : `${target.order.buyerEmail} (${formatTotal(target.order)})`
  return target.decision === 'approve'
    ? { title: '¿Aprobar la transferencia?', body: `Confirmá que la transferencia de ${who} se acreditó en la cuenta. El pedido pasa a pagado y sigue con la entrega de la key.`, confirmLabel: 'Aprobar' }
    : { title: '¿Rechazar la transferencia?', body: `El pedido de ${who} se cancela y no se entrega ninguna key.`, confirmLabel: 'Rechazar' }
})

async function confirmDecision() {
  const target = pendingDecision.value
  if (!target) return
  const ok = target.decision === 'approve' ? await approve(target.order.id) : await reject(target.order.id)
  if (ok) pendingDecision.value = null
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-2xl font-bold">Transferencias a validar</h1>
      <AppButton type="button" variant="ghost" size="sm" :disabled="status === 'pending'" @click="load()">Actualizar</AppButton>
    </div>

    <div v-if="status === 'pending'" class="flex flex-col gap-2">
      <Skeleton v-for="n in 3" :key="n" class="h-12 w-full" />
    </div>
    <ErrorState v-else-if="status === 'error'" :detail="error?.friendlyMessage()">
      <template #retry><AppButton variant="ghost" @click="load()">Reintentar</AppButton></template>
    </ErrorState>
    <EmptyState v-else-if="!orders.length" title="No hay transferencias para validar" description="Cuando un comprador avise que transfirió, el pedido aparece acá." />
    <div v-else class="overflow-x-auto rounded-xl border border-white/10">
      <table class="w-full min-w-[820px] text-left">
        <thead>
          <tr class="border-b border-white/10 text-xs uppercase tracking-wide text-white/50">
            <th v-if="showDate" class="px-3 py-2 font-medium">Fecha</th>
            <th class="px-3 py-2 font-medium">Email</th>
            <th class="px-3 py-2 font-medium">Teléfono</th>
            <th v-if="showTotal" class="px-3 py-2 font-medium">Total</th>
            <th class="px-3 py-2 font-medium">Items</th>
            <th class="px-3 py-2 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id" class="border-b border-white/5 last:border-0" :data-transfer-row="order.id">
            <td v-if="showDate" class="whitespace-nowrap px-3 py-2 text-sm text-white/70">{{ formatDateTime(order.createdAt) }}</td>
            <td class="whitespace-nowrap px-3 py-2 text-sm">{{ order.buyerEmail }}</td>
            <td class="whitespace-nowrap px-3 py-2 font-mono text-xs text-white/70">{{ order.buyerPhone ?? '—' }}</td>
            <td v-if="showTotal" class="whitespace-nowrap px-3 py-2 text-sm font-medium">{{ formatTotal(order) }}</td>
            <td class="px-3 py-2 text-sm">
              <ul class="flex max-w-[320px] flex-col gap-0.5 text-xs text-white/70">
                <li v-for="item in order.items" :key="item.itemId" class="truncate" :title="`${item.productName} — ${item.variantName} × ${item.quantity}`">
                  {{ item.productName }} <span class="text-white/50">— {{ item.variantName }}</span> × {{ item.quantity }}
                </li>
              </ul>
            </td>
            <td class="whitespace-nowrap px-3 py-2">
              <div class="flex items-center gap-2">
                <AppButton
                  type="button"
                  variant="success"
                  size="sm"
                  :loading="deciding[order.id] === 'approve'"
                  :disabled="!!deciding[order.id]"
                  @click="pendingDecision = { order, decision: 'approve' }"
                >
                  Aprobar
                </AppButton>
                <AppButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  :loading="deciding[order.id] === 'reject'"
                  :disabled="!!deciding[order.id]"
                  @click="pendingDecision = { order, decision: 'reject' }"
                >
                  Rechazar
                </AppButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmDialog
      v-if="pendingDecision && dialogCopy"
      :title="dialogCopy.title"
      :body="dialogCopy.body"
      :confirm-label="dialogCopy.confirmLabel"
      cancel-label="Volver"
      :loading="!!deciding[pendingDecision.order.id]"
      @confirm="confirmDecision"
      @cancel="pendingDecision = null"
    />
  </section>
</template>
