<script setup lang="ts">
import type { ProductDetail } from '~/types/api'
import type { ApiError } from '~/composables/useApi'

const slug = useRoute().params.slug as string
const api = useApi()

// Catalog spec: Product Detail Lookup (GET /catalog/products/{slug}; unknown or inactive slug → 404).
const { data: product, status, error, refresh } = await useAsyncData(`product-${slug}`, () => api<ProductDetail>(`/catalog/products/${slug}`))

const httpStatus = error.value?.statusCode ?? (error.value?.cause as ApiError | undefined)?.status
if (httpStatus === 404) throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado', fatal: true })

useHead({ title: () => (product.value ? `${product.value.name} · Nexo` : 'Nexo') })

// The API only returns active variants, so the first one is the default selection.
const selectedId = ref<string | null>(product.value?.variants[0]?.id ?? null)
const selected = computed(() => product.value?.variants.find((v) => v.id === selectedId.value) ?? product.value?.variants[0])

const cart = useCart()
const feedback = ref<'added' | 'max-items' | null>(null)
function addToCart() {
  if (!product.value || !selected.value) return
  const { slug, name, imageUrl } = product.value
  const result = cart.add({ variantId: selected.value.id, productSlug: slug, productName: name, variantName: selected.value.name, unitPrice: selected.value.price, currency: selected.value.currency, imageUrl })
  feedback.value = result.ok ? 'added' : result.reason
  if (result.ok) cart.open()
  setTimeout(() => (feedback.value = null), 1500)
}
</script>

<template>
  <Skeleton v-if="status === 'pending'" class="h-96 w-full" />
  <ErrorState v-else-if="!product">
    <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
  </ErrorState>
  <article v-else class="grid gap-8 lg:grid-cols-2">
    <img :src="product.imageUrl" :alt="product.name" class="aspect-[4/3] w-full rounded-3xl object-cover" />
    <div class="flex flex-col gap-5">
      <AppBadge tone="accent" class="self-start">{{ product.platform }}</AppBadge>
      <h1 class="text-3xl font-bold sm:text-4xl">{{ product.name }}</h1>
      <p class="text-white/70">{{ product.description }}</p>
      <VariantSelector v-model="selectedId" :variants="product.variants" />
      <p v-if="selected" class="flex items-baseline gap-3">
        <span class="text-3xl font-bold">{{ formatMoney(selected.price, selected.currency) }}</span>
        <span v-if="selected.oldPrice" class="text-white/40 line-through">{{ formatMoney(selected.oldPrice, selected.currency) }}</span>
      </p>
      <AppButton size="lg" :disabled="!selected" @click="addToCart()">{{ feedback === 'added' ? 'Agregado' : 'Agregar al carrito' }}</AppButton>
      <p v-if="feedback === 'max-items'" class="text-sm text-red-300" role="alert">El carrito admite hasta 20 productos distintos.</p>
      <TrustBadges />
    </div>
  </article>
</template>
