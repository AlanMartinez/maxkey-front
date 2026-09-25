<script setup lang="ts">
import type { CreateProductVariantRequest, UpdateProductRequest, UpdateProductVariantRequest } from '~/types/api'
import { PLATFORMS } from '~/utils/platforms'
import {
  type CatalogFilters as CatalogFilterState,
  DEFAULT_CATALOG_FILTERS,
  catalogFiltersFromQuery,
  catalogFiltersToQuery,
  catalogPlatformOptions,
  filterCatalog,
  hasActiveCatalogFilters,
} from '~/utils/adminCatalogFilter'

definePageMeta({ middleware: ['auth', 'admin'] })
useHead({ title: 'Catálogo · Admin · CHEKEYS' })

const route = useRoute()
const highlightedProductId = typeof route.query.product === 'string' ? route.query.product : undefined

const {
  products,
  status,
  error,
  refresh,
  saving,
  saveProduct,
  saveVariant,
  createProduct,
  deleteProduct,
  createVariant,
  deleteVariant,
} = await useAdminCatalog()

const { guides } = await useAdminGuides()

// Coming from the "Ver en Catálogo" Vault link: the card itself opens pre-expanded (initiallyExpanded
// prop below), this just brings it into view. No-op if the id doesn't match any rendered card.
onMounted(() => {
  if (!highlightedProductId) return
  nextTick(() => {
    document.getElementById(`catalog-product-${highlightedProductId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
})

const showNewProduct = ref(false)
const newProduct = ref({ slug: '', name: '', platform: '', description: '', imageKey: '' })
const newProductUpload = ref<(() => Promise<string[]>)>()
const uploadingNewProductMedia = ref(false)

// Client-side filters (the admin endpoint returns the whole catalog); mirrored in the URL so a reload
// or a shared link keeps them. The Vault `product` param is preserved alongside.
const router = useRouter()
const filters = ref<CatalogFilterState>(catalogFiltersFromQuery(route.query))
watch(filters, (value) => {
  const keep = typeof route.query.product === 'string' ? { product: route.query.product } : {}
  router.replace({ query: { ...keep, ...catalogFiltersToQuery(value) } })
})
const filtersActive = computed(() => hasActiveCatalogFilters(filters.value))
function clearFilters() {
  filters.value = { ...DEFAULT_CATALOG_FILTERS }
}

const platformOptions = computed(() => catalogPlatformOptions(products.value))
const filteredProducts = computed(() => filterCatalog(products.value, filters.value))

// Each ProductEditor is a full form; mounting hundreds at once makes the page sluggish, so it grows in pages.
const PAGE_SIZE = 20
const visibleCount = ref(PAGE_SIZE)
watch(filters, () => (visibleCount.value = PAGE_SIZE))
const visibleProducts = computed(() => {
  // The Vault deep-link target must render even when it falls past the first page.
  const highlightedIndex = highlightedProductId ? filteredProducts.value.findIndex((p) => p.id === highlightedProductId) : -1
  return filteredProducts.value.slice(0, Math.max(visibleCount.value, highlightedIndex + 1))
})

async function submitNewProduct() {
  if (uploadingNewProductMedia.value) return
  uploadingNewProductMedia.value = true
  try {
    const imagePaths = await (newProductUpload.value?.() ?? Promise.resolve([]))
    if (imagePaths[0]) newProduct.value.imageKey = imagePaths[0]
  const created = await createProduct({
    slug: newProduct.value.slug,
    name: newProduct.value.name,
    platform: newProduct.value.platform,
    description: newProduct.value.description || undefined,
    imageKey: newProduct.value.imageKey || undefined,
    activationGuideId: null,
    activationType: null,
    imageKeys: [],
    isActive: true,
  })
  if (created) {
    newProduct.value = { slug: '', name: '', platform: '', description: '', imageKey: '' }
    showNewProduct.value = false
  }
  } catch {
    // AdminImageUpload renders upload error; do not create product when media upload fails.
  } finally {
    uploadingNewProductMedia.value = false
  }
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">Catálogo</h1>
      <AppButton size="sm" @click="showNewProduct = !showNewProduct">{{ showNewProduct ? 'Cancelar' : '+ Nuevo producto' }}</AppButton>
    </div>

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
        <select v-model="newProduct.platform" required class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent">
          <option value="" disabled>Seleccionar plataforma</option>
          <option v-for="platform in PLATFORMS" :key="platform.value" :value="platform.value">{{ platform.value }}</option>
        </select>
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="text-white/70">Descripción</span>
        <textarea v-model="newProduct.description" rows="2" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-accent" />
      </label>
      <div class="flex flex-col gap-2 text-sm">
        <span class="text-white/70">Imagen principal</span>
        <AdminImageUpload folder="/products" :disabled="saving || uploadingNewProductMedia" @register="newProductUpload = $event" />
      </div>
      <AppButton type="submit" size="sm" :loading="saving" class="self-start">Crear producto</AppButton>
    </form>

    <CatalogFilters
      v-if="products.length"
      v-model="filters"
      :platforms="platformOptions"
      :shown="filteredProducts.length"
      :total="products.length"
      :active="filtersActive"
      @clear="clearFilters"
    />

    <div v-if="status === 'pending'" class="grid gap-4">
      <Skeleton v-for="n in 3" :key="n" class="h-24 w-full" />
    </div>
    <ErrorState v-else-if="error">
      <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
    </ErrorState>
    <EmptyState v-else-if="!products.length" title="Todavía no hay productos" />
    <EmptyState v-else-if="!filteredProducts.length" title="Ningún producto coincide con los filtros">
      <AppButton variant="ghost" size="sm" @click="clearFilters">Limpiar filtros</AppButton>
    </EmptyState>
    <div v-else class="grid gap-4">
      <ProductEditor
        v-for="product in visibleProducts"
        :key="product.id"
        :product="product"
        :guides="guides"
        :saving="saving"
        :initially-expanded="product.id === highlightedProductId"
        @save="(body: UpdateProductRequest) => saveProduct(product.id, body)"
        @save-variant="(variantId: string, body: UpdateProductVariantRequest) => saveVariant(product.id, variantId, body)"
        @delete-product="deleteProduct(product.id)"
        @delete-variant="(variantId: string) => deleteVariant(product.id, variantId)"
        @create-variant="(body: CreateProductVariantRequest) => createVariant(product.id, body)"
      />
      <AppButton
        v-if="visibleProducts.length < filteredProducts.length"
        variant="ghost"
        size="sm"
        class="self-center"
        data-testid="show-more"
        @click="visibleCount += PAGE_SIZE"
      >
        Mostrar más ({{ filteredProducts.length - visibleProducts.length }} restantes)
      </AppButton>
    </div>
  </section>
</template>
