<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })
useHead({ title: 'Compradores · Admin · Nexo' })

// admin-buyers spec: Buyer Listing Grouped By Email + Resend Delivery Email; design D4.
const { buyers, total, page, pageSize, status, error, load, search, goToPage, resending, resendError, resendSuccess, resendDelivery } = useAdminBuyers()

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

    <div v-if="status === 'pending'" class="grid gap-4">
      <Skeleton v-for="n in 3" :key="n" class="h-32 w-full" />
    </div>
    <ErrorState v-else-if="status === 'error'" :detail="error?.detail ?? error?.title">
      <template #retry><AppButton variant="ghost" @click="load()">Reintentar</AppButton></template>
    </ErrorState>
    <EmptyState v-else-if="!buyers.length" title="No se encontraron compradores" />
    <div v-else class="grid gap-4">
      <BuyerCard
        v-for="buyer in buyers"
        :key="buyer.email"
        :buyer="buyer"
        :resending="resending"
        :resend-error="resendError"
        :resend-success="resendSuccess"
        @resend="resendDelivery"
      />
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
