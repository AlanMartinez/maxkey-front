<script setup lang="ts">
import type { AdminBuyerOrder, OrderStatus } from '~/types/api'

definePageMeta({ middleware: ['auth', 'admin'] })
useHead({ title: 'Compradores · Admin · CHEKEYS' })

// admin-buyers spec: Buyer Listing Grouped By Email + Resend Delivery Email; design D4.
// Table is flattened to one row per order (see BuyerOrderRow.vue) rather than grouped cards, to scale
// to many buyers/orders.
const {
  buyers, total, page, pageSize, status, error, load, search, goToPage,
  resending, resendError, resendSuccess, resendDelivery,
  assigning, assignError, assignSuccess, assignIncomplete, assignKeys,
  delivering, deliverError, deliverSuccess, deliverOrder,
} = useAdminBuyers()

await load()

const searchTerm = ref('')
function onSearch() {
  search(searchTerm.value)
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

// --- Per-column filters (client-side, current page only) -----------------------------------------
// The /admin/buyers endpoint only supports an `email` query param server-side, so Estado/Acción/Item
// filtering happens against whatever buyers are already loaded for the current page.

const statusOrder: OrderStatus[] = ['Pending', 'Paid', 'AwaitingFulfillment', 'KeysAssigned', 'Delivered', 'Cancelled']
// Mirrors OrderStatusBadge.vue's label copy so the filter options read the same as the badges do.
const statusLabels: Record<OrderStatus, string> = {
  Pending: 'Pendiente de pago',
  Paid: 'Pagado',
  AwaitingFulfillment: 'Preparando entrega',
  KeysAssigned: 'Claves asignadas',
  Delivered: 'Entregado',
  Cancelled: 'Cancelado',
}

type ActionKind = 'assign' | 'deliver' | 'resend'

// Mirrors BuyerOrderRow.vue's action-gating exactly. KeysAssigned orders legitimately expose both
// "assign" and "deliver" at once, so this returns an array rather than a single kind.
function orderActionKinds(status: OrderStatus): ActionKind[] {
  const kinds: ActionKind[] = []
  if (status !== 'Delivered' && status !== 'Cancelled') kinds.push('assign')
  if (status === 'KeysAssigned') kinds.push('deliver')
  if (status === 'Delivered') kinds.push('resend')
  return kinds
}

interface FlatRow { email: string; order: AdminBuyerOrder }
const flatRows = computed<FlatRow[]>(() => buyers.value.flatMap((buyer) => buyer.orders.map((order) => ({ email: buyer.email, order }))))

const itemOptions = computed(() => {
  const names = new Set<string>()
  for (const row of flatRows.value) {
    for (const item of row.order.items) names.add(item.productName)
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b))
})

const filterStatus = ref<OrderStatus | 'all'>('all')
const filterAction = ref<ActionKind | 'none' | 'all'>('all')
const filterItem = ref<string>('all')

const hasActiveFilters = computed(() => filterStatus.value !== 'all' || filterAction.value !== 'all' || filterItem.value !== 'all')

function clearFilters() {
  filterStatus.value = 'all'
  filterAction.value = 'all'
  filterItem.value = 'all'
}

// Deliberately NOT reset on search()/goToPage(): an admin filtering while paginating or searching
// expects the filter to stay applied across the reload, not silently drop. Only the explicit
// "Limpiar filtros" control clears them.
const filteredRows = computed(() =>
  flatRows.value.filter((row) => {
    if (filterStatus.value !== 'all' && row.order.status !== filterStatus.value) return false
    if (filterItem.value !== 'all' && !row.order.items.some((i) => i.productName === filterItem.value)) return false
    if (filterAction.value !== 'all') {
      const kinds = orderActionKinds(row.order.status)
      if (filterAction.value === 'none' ? kinds.length > 0 : !kinds.includes(filterAction.value)) return false
    }
    return true
  }),
)
</script>

<template>
  <section class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Compradores</h1>

    <form class="flex flex-wrap gap-2" @submit.prevent="onSearch">
      <label class="flex-1">
        <span class="sr-only">Buscar por email</span>
        <input
          v-model="searchTerm"
          type="search"
          placeholder="Buscar por email..."
          class="h-10 w-full min-w-[200px] rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-accent"
        />
      </label>
      <AppButton type="submit" size="sm">Buscar</AppButton>
    </form>

    <div v-if="status === 'pending'" class="overflow-x-auto rounded-xl border border-white/10">
      <table class="w-full min-w-[720px] text-left">
        <thead>
          <tr class="border-b border-white/10 text-xs uppercase tracking-wide text-white/50">
            <th class="px-3 py-2 font-medium">Email</th>
            <th class="px-3 py-2 font-medium">Pedido</th>
            <th class="px-3 py-2 font-medium">Estado</th>
            <th class="px-3 py-2 font-medium">Total</th>
            <th class="px-3 py-2 font-medium">Items</th>
            <th class="px-3 py-2 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in 5" :key="n" class="border-b border-white/5 last:border-0">
            <td class="px-3 py-3" colspan="6"><Skeleton class="h-6 w-full" /></td>
          </tr>
        </tbody>
      </table>
    </div>
    <ErrorState v-else-if="status === 'error'" :detail="error?.friendlyMessage()">
      <template #retry><AppButton variant="ghost" @click="load()">Reintentar</AppButton></template>
    </ErrorState>
    <EmptyState v-else-if="!buyers.length" title="No se encontraron compradores" />
    <template v-else>
      <div v-if="hasActiveFilters" class="flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
        <span>Filtros aplicados a la página actual.</span>
        <AppButton type="button" variant="ghost" size="sm" @click="clearFilters">Limpiar filtros</AppButton>
      </div>

      <div class="overflow-x-auto rounded-xl border border-white/10">
        <table class="w-full min-w-[720px] text-left">
          <thead>
            <tr class="border-b border-white/10 text-xs uppercase tracking-wide text-white/50">
              <th class="px-3 py-2 font-medium">Email</th>
              <th class="px-3 py-2 font-medium">Pedido</th>
              <th class="px-3 py-2 font-medium">
                <div class="flex flex-col gap-1">
                  <span>Estado</span>
                  <select
                    v-model="filterStatus"
                    class="h-8 w-full rounded-md border border-white/10 bg-white/5 px-2 text-xs font-normal normal-case text-white outline-none focus:border-accent"
                  >
                    <option value="all">Todos</option>
                    <option v-for="s in statusOrder" :key="s" :value="s">{{ statusLabels[s] }}</option>
                  </select>
                </div>
              </th>
              <th class="px-3 py-2 font-medium">Total</th>
              <th class="px-3 py-2 font-medium">
                <div class="flex flex-col gap-1">
                  <span>Items</span>
                  <select
                    v-model="filterItem"
                    class="h-8 w-full rounded-md border border-white/10 bg-white/5 px-2 text-xs font-normal normal-case text-white outline-none focus:border-accent"
                  >
                    <option value="all">Todos</option>
                    <option v-for="name in itemOptions" :key="name" :value="name">{{ name }}</option>
                  </select>
                </div>
              </th>
              <th class="px-3 py-2 font-medium">
                <div class="flex flex-col gap-1">
                  <span>Acciones</span>
                  <select
                    v-model="filterAction"
                    class="h-8 w-full rounded-md border border-white/10 bg-white/5 px-2 text-xs font-normal normal-case text-white outline-none focus:border-accent"
                  >
                    <option value="all">Todas</option>
                    <option value="assign">Asignar</option>
                    <option value="deliver">Entregar</option>
                    <option value="resend">Reenviar</option>
                    <option value="none">Sin acción</option>
                  </select>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="filteredRows.length">
              <BuyerOrderRow
                v-for="row in filteredRows"
                :key="row.order.id"
                :email="row.email"
                :order="row.order"
                :resending="resending"
                :resend-error="resendError"
                :resend-success="resendSuccess"
                :assigning="assigning"
                :assign-error="assignError"
                :assign-success="assignSuccess"
                :assign-incomplete="assignIncomplete"
                :delivering="delivering"
                :deliver-error="deliverError"
                :deliver-success="deliverSuccess"
                @resend="resendDelivery"
                @assign="assignKeys"
                @deliver="deliverOrder"
              />
            </template>
            <tr v-else>
              <td colspan="6" class="px-3 py-10 text-center text-sm text-white/60">
                <p>Ningún pedido coincide con los filtros aplicados.</p>
                <AppButton type="button" variant="ghost" size="sm" class="mt-2" @click="clearFilters">Limpiar filtros</AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-if="buyers.length" class="flex items-center justify-between gap-2 text-sm text-white/70">
      <span>Página {{ page }} de {{ totalPages }}</span>
      <div class="flex gap-2">
        <AppButton type="button" variant="ghost" size="sm" :disabled="page <= 1" @click="goToPage(page - 1)">Anterior</AppButton>
        <AppButton type="button" variant="ghost" size="sm" :disabled="page >= totalPages" @click="goToPage(page + 1)">Siguiente</AppButton>
      </div>
    </div>
  </section>
</template>
