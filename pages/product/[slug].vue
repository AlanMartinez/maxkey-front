<script setup lang="ts">
import type { ProductDetail } from '~/types/api'
import type { ApiError } from '~/composables/useApi'
import { defaultVariant, galleryImages, recommendedVariant, toCartLine } from '~/utils/cartLine'

const slug = useRoute().params.slug as string
const api = useApi()

// Catalog spec: Product Detail Lookup (GET /catalog/products/{slug}; unknown or inactive slug → 404).
const { data: product, status, error, refresh } = await useAsyncData(`product-${slug}`, () => api<ProductDetail>(`/catalog/products/${slug}`))

const httpStatus = error.value?.statusCode ?? (error.value?.cause as ApiError | undefined)?.status
if (httpStatus === 404) throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado', fatal: true })

useHead({ title: () => (product.value ? `${product.value.name} · Nexo` : 'Nexo') })

// PLACEHOLDER: the API exposes no ratings yet; static figures mirror the mock until reviews land backend-side.
const PLACEHOLDER_RATING: { value: number; reviews: number } = { value: 4.9, reviews: 3400 }
const ratingValue = PLACEHOLDER_RATING.value.toLocaleString('es-AR', { minimumFractionDigits: 1 })
const ratingReviews = `${PLACEHOLDER_RATING.reviews.toLocaleString('es-AR')} reseñas`

const selectedId = ref<string | null>(defaultVariant(product.value?.variants ?? [])?.id ?? null)
const selected = computed(() => product.value?.variants.find((v) => v.id === selectedId.value) ?? defaultVariant(product.value?.variants ?? []))
const recommendedId = computed(() => recommendedVariant(product.value?.variants ?? [])?.id ?? null)
const images = computed(() => (product.value ? galleryImages(product.value) : []))

const cart = useCart()
const feedback = ref<'added' | 'max-items' | null>(null)
const buying = ref(false)
const errorMessage = computed(() => (feedback.value === 'max-items' ? 'El carrito admite hasta 20 productos distintos.' : null))

function addSelected() {
  if (!product.value || !selected.value) return false
  const result = cart.add(toCartLine(product.value, selected.value))
  feedback.value = result.ok ? 'added' : result.reason
  setTimeout(() => (feedback.value = null), 1500)
  return result.ok
}

function addToCart() {
  if (addSelected()) cart.open()
}

// Buy now skips the drawer: the line goes straight into the cart and the buyer lands on /checkout.
async function buyNow() {
  if (!addSelected()) return
  buying.value = true
  try {
    await navigateTo('/checkout')
  } finally {
    buying.value = false
  }
}
</script>

<template>
  <Skeleton v-if="status === 'pending'" class="h-96 w-full" />
  <ErrorState v-else-if="!product">
    <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
  </ErrorState>
  <article v-else class="flex flex-col gap-10">
    <nav aria-label="Migas de pan" class="text-sm text-white/50">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/" class="transition hover:text-white">Inicio</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li><NuxtLink :to="{ path: '/', query: { platform: product.platform } }" class="transition hover:text-white">{{ product.platform }}</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li class="text-white/80" aria-current="page">{{ product.name }}</li>
      </ol>
    </nav>

    <div class="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
      <div class="flex flex-col gap-6">
        <ProductGallery :images="images" :alt="product.name" />

        <section aria-labelledby="about-heading">
          <h2 id="about-heading" class="mb-3 text-xl font-semibold">Sobre este producto</h2>
          <p class="leading-relaxed text-white/60">{{ product.description }}</p>
        </section>
      </div>

      <div class="flex flex-col gap-7 lg:sticky lg:top-24">
        <header class="flex flex-col gap-2">
          <p class="text-sm text-white/60">{{ product.platform }}</p>
          <h1 class="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{{ product.name }}</h1>
          <p class="flex items-center gap-1.5 text-sm text-white/60" aria-label="Valoración">
            <svg class="h-3.5 w-3.5 text-[#E8B923]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.3l7.1-.7z" />
            </svg>
            <span class="text-white">{{ ratingValue }}</span> · {{ ratingReviews }}
          </p>
        </header>

        <VariantSelector v-model="selectedId" :variants="product.variants" :recommended-id="recommendedId" />

        <PurchasePanel :variant="selected" :busy="buying" :added-label="feedback === 'added'" :error="errorMessage" @buy="buyNow()" @add="addToCart()" />
      </div>
    </div>
  </article>
</template>
