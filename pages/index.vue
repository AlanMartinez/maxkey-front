<script setup lang="ts">
import type { ProductSummary } from '~/types/api'

const api = useApi()
const platform = ref<string | null>(null)
// Typed in AppHeader's search box; debounced into `q` before hitting the API.
const search = useState('catalog-search', () => '')
const q = ref(search.value.trim())
let debounce: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => { q.value = value.trim() }, 300)
})

// Catalog spec: Product Listing, Filter by platform, Search by name (GET /catalog/products?platform=&q=).
const { data, status, refresh } = await useAsyncData(
  'catalog',
  () => api<ProductSummary[]>('/catalog/products', { query: { platform: platform.value ?? undefined, q: q.value || undefined } }),
  { watch: [platform, q], default: () => [] },
)

// Chips are derived from products seen so far, so filtering by one platform does not hide the others.
const platforms = ref<string[]>([])
watch(data, (list) => {
  for (const product of list ?? []) if (!platforms.value.includes(product.platform)) platforms.value.push(product.platform)
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-10">
    <div class="flex flex-col gap-6">
      <HeroCarousel />
      <TrustStrip />
    </div>
    <section id="catalogo" class="flex flex-col gap-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-2xl font-bold">Catálogo</h2>
        <PlatformFilter v-model="platform" :platforms="platforms" />
      </div>
      <ErrorState v-if="status === 'error'">
        <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
      </ErrorState>
      <ProductGrid v-else :products="data ?? []" :pending="status === 'pending'">
        <template #empty><EmptyState title="Sin resultados" description="Prueba con otra plataforma u otra búsqueda." /></template>
      </ProductGrid>
    </section>
  </div>
</template>
