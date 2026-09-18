<script setup lang="ts">
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
    <div v-else class="overflow-x-auto rounded-xl border border-white/10">
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
          <template v-for="buyer in buyers" :key="buyer.email">
            <BuyerOrderRow
              v-for="order in buyer.orders"
              :key="order.id"
              :email="buyer.email"
              :order="order"
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
        </tbody>
      </table>
    </div>

    <div v-if="buyers.length" class="flex items-center justify-between gap-2 text-sm text-white/70">
      <span>Página {{ page }} de {{ totalPages }}</span>
      <div class="flex gap-2">
        <AppButton type="button" variant="ghost" size="sm" :disabled="page <= 1" @click="goToPage(page - 1)">Anterior</AppButton>
        <AppButton type="button" variant="ghost" size="sm" :disabled="page >= totalPages" @click="goToPage(page + 1)">Siguiente</AppButton>
      </div>
    </div>
  </section>
</template>
