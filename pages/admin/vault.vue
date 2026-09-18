<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })
useHead({ title: 'Vault · Admin · CHEKEYS' })

const route = useRoute()
const highlightedProductId = typeof route.query.product === 'string' ? route.query.product : undefined

const {
  products,
  status,
  error,
  refresh,
  toggling,
  toggleError,
  toggleVault,
  uploading,
  uploadError,
  uploadSuccess,
  uploadKeys,
  fetchingKeys,
  keysError,
  variantKeys,
  fetchVariantKeys,
} = await useAdminVault()

// Coming from the "Ver en Vault" catalog link: the row itself opens pre-expanded (initiallyExpanded
// prop below), this just brings it into view. No-op if the id doesn't match any rendered row.
onMounted(() => {
  if (!highlightedProductId) return
  nextTick(() => {
    document.getElementById(`vault-product-${highlightedProductId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
})
</script>

<template>
  <section class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Vault</h1>
    <p class="text-sm text-white/60">Precargá stock de claves por variante y activá la auto-entrega por producto.</p>

    <div v-if="status === 'pending'" class="grid gap-4">
      <Skeleton v-for="n in 3" :key="n" class="h-24 w-full" />
    </div>
    <ErrorState v-else-if="error">
      <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
    </ErrorState>
    <EmptyState v-else-if="!products.length" title="Todavía no hay productos" />
    <div v-else class="grid gap-4">
      <VaultProductRow
        v-for="product in products"
        :key="product.id"
        :product="product"
        :toggling="!!toggling[product.id]"
        :toggle-error="toggleError[product.id] ?? null"
        :uploading="uploading"
        :upload-error="uploadError"
        :upload-success="uploadSuccess"
        :fetching-keys="fetchingKeys"
        :keys-error="keysError"
        :variant-keys="variantKeys"
        :initially-expanded="product.id === highlightedProductId"
        @toggle="(enabled) => toggleVault(product.id, enabled)"
        @upload="(variantId, rawCodes) => uploadKeys(product.id, variantId, rawCodes)"
        @view-keys="(variantId) => fetchVariantKeys(variantId)"
      />
    </div>
  </section>
</template>
