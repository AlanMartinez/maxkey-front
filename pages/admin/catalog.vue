<script setup lang="ts">
import type { UpdateProductRequest, UpdateProductVariantRequest } from '~/types/api'

definePageMeta({ middleware: ['auth', 'admin'] })
useHead({ title: 'Catálogo · Admin · Nexo' })

const { products, status, error, refresh, saving, saveError, saveProduct, saveVariant } = await useAdminCatalog()
</script>

<template>
  <section class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Catálogo</h1>
    <p v-if="saveError" role="alert" class="text-sm text-red-300">{{ saveError.detail ?? saveError.title }}</p>

    <div v-if="status === 'pending'" class="grid gap-4">
      <Skeleton v-for="n in 3" :key="n" class="h-48 w-full" />
    </div>
    <ErrorState v-else-if="error">
      <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
    </ErrorState>
    <EmptyState v-else-if="!products.length" title="Todavía no hay productos" />
    <div v-else class="grid gap-4">
      <ProductEditor
        v-for="product in products"
        :key="product.id"
        :product="product"
        :saving="saving"
        @save="(body: UpdateProductRequest) => saveProduct(product.id, body)"
        @save-variant="(variantId: string, body: UpdateProductVariantRequest) => saveVariant(product.id, variantId, body)"
      />
    </div>
  </section>
</template>
