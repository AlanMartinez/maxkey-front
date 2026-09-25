<script setup lang="ts">
import type { ProductSummary } from '~/types/api'
import { SITE_DESCRIPTION, SITE_NAME } from '~/utils/business'

const seo = useSeo({ title: 'Chekeys · Venta de keys de juegos, Robux y gift cards en LATAM', description: SITE_DESCRIPTION, path: '/' })

// WebSite + Organization tell Google the brand name ("Chekeys" / "CHEKEYS") behind this domain, so a
// search for the brand resolves to the home page with the right site name and logo.
const siteUrl = seo.url()
const brandJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${siteUrl}#website`, name: SITE_NAME, alternateName: ['CHEKEYS', 'Che Keys'], url: siteUrl, inLanguage: 'es' },
    { '@type': 'Organization', '@id': `${siteUrl}#organization`, name: SITE_NAME, url: siteUrl, logo: seo.image() },
  ],
}).replace(/</g, '\\u003c')
useHead({ script: [{ type: 'application/ld+json', innerHTML: brandJsonLd }] })

const api = useApi()
// Pre-selected from `?platform=` so the product breadcrumb can link back to a filtered catalog.
const platform = ref<string | null>((useRoute().query.platform as string | undefined) || null)
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
const previews = useProductPreviewStore()
watch(data, (list) => {
  for (const product of list ?? []) if (!platforms.value.includes(product.platform)) platforms.value.push(product.platform)
  previews.rememberAll(list ?? [])
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-8 sm:gap-10">
    <div class="flex flex-col gap-4 sm:gap-6">
      <HeroCarousel />
      <TrustStrip />
    </div>
    <section id="catalogo" class="flex flex-col gap-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold">Recargá y jugá</h1>
          <p class="mt-1 text-sm italic text-white/50">Robux, diamantes de Free Fire y keys de juegos, entregados por email en minutos en toda LATAM.</p>
        </div>
        <PlatformFilter v-model="platform" :platforms="platforms" />
      </div>
      <ErrorState v-if="status === 'error'">
        <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
      </ErrorState>
      <ProductGrid v-else :products="data ?? []" :pending="status === 'pending'">
        <template #empty><EmptyState title="Sin resultados" description="Probá con otra plataforma u otra búsqueda." /></template>
      </ProductGrid>
    </section>
  </div>
</template>
