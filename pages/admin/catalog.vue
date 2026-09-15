<script setup lang="ts">
import type { CreateProductVariantRequest, UpdateProductRequest, UpdateProductVariantRequest } from '~/types/api'

definePageMeta({ middleware: ['auth', 'admin'] })
useHead({ title: 'Catálogo · Admin · Chekeys' })

const {
  products,
  status,
  error,
  refresh,
  saving,
  saveError,
  saveProduct,
  saveVariant,
  createProduct,
  deleteProduct,
  createVariant,
  deleteVariant,
} = await useAdminCatalog()

const showNewProduct = ref(false)
const newProduct = ref({ slug: '', name: '', platform: '', description: '' })

async function submitNewProduct() {
  const created = await createProduct({
    slug: newProduct.value.slug,
    name: newProduct.value.name,
    platform: newProduct.value.platform,
    description: newProduct.value.description || undefined,
    isActive: true,
  })
  if (created) {
    newProduct.value = { slug: '', name: '', platform: '', description: '' }
    showNewProduct.value = false
  }
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">Catálogo</h1>
      <AppButton size="sm" @click="showNewProduct = !showNewProduct">{{ showNewProduct ? 'Cancelar' : '+ Nuevo producto' }}</AppButton>
    </div>
    <p v-if="saveError" role="alert" class="text-sm text-red-300">{{ saveError.detail ?? saveError.title }}</p>

    <form v-if="showNewProduct" class="glass flex flex-col gap-4 rounded-2xl p-6" @submit.prevent="submitNewProduct">
      <label class="flex flex-col gap-2 text-sm">
        <span class="text-white/70">Slug</span>
        <input v-model="newProduct.slug" type="text" required placeholder="cyberpunk-2077" class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="text-white/70">Nombre</span>
        <input v-model="newProduct.name" type="text" required class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="text-white/70">Plataforma</span>
        <input v-model="newProduct.platform" type="text" required placeholder="Steam" class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="text-white/70">Descripción</span>
        <textarea v-model="newProduct.description" rows="2" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-accent" />
      </label>
      <AppButton type="submit" size="sm" :loading="saving" class="self-start">Crear producto</AppButton>
    </form>

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
        @delete-product="deleteProduct(product.id)"
        @delete-variant="(variantId: string) => deleteVariant(product.id, variantId)"
        @create-variant="(body: CreateProductVariantRequest) => createVariant(product.id, body)"
      />
    </div>
  </section>
</template>
