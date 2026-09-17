<script setup lang="ts">
import type { ProductDetail } from '~/types/api'
import type { ApiError } from '~/composables/useApi'
import { defaultVariant, galleryImages, recommendedVariant, toCartLine } from '~/utils/cartLine'
import { PLACEHOLDER_IMAGE } from '~/utils/productImage'
import { renderMarkdown, stripMarkdown } from '~/utils/markdown'

const slug = useRoute().params.slug as string
const api = useApi()

// Catalog spec: Product Detail Lookup (GET /catalog/products/{slug}; unknown or inactive slug → 404).
const { data: product, status, error, refresh } = await useAsyncData(`product-${slug}`, () => api<ProductDetail>(`/catalog/products/${slug}`))

const httpStatus = error.value?.statusCode ?? (error.value?.cause as ApiError | undefined)?.status
if (httpStatus === 404) throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado', fatal: true })

useHead({ title: () => (product.value ? `${product.value.name} · CHEKEYS` : 'CHEKEYS') })

const selectedId = ref<string | null>(defaultVariant(product.value?.variants ?? [])?.id ?? null)
const selected = computed(() => product.value?.variants.find((v) => v.id === selectedId.value) ?? defaultVariant(product.value?.variants ?? []))
const recommendedId = computed(() => recommendedVariant(product.value?.variants ?? [])?.id ?? null)
const images = computed(() => {
  const base = product.value ? galleryImages(product.value) : []
  // DEV-ONLY: pads with placeholders so the thumbnail/gallery UI can be previewed before real
  // multi-image data exists. `import.meta.dev` is dead-code-eliminated in production builds, so
  // real buyers never see fake thumbnails.
  if (import.meta.dev && base.length && base.length < 4) {
    return [...base, ...Array.from({ length: 4 - base.length }, () => PLACEHOLDER_IMAGE)]
  }
  return base
})

type SpecItem = { icon: 'platform' | 'region' | 'type'; label: string; value: string; link?: { text: string; href: string } }

const specs = computed<SpecItem[]>(() => {
  if (!product.value) return []
  const items: SpecItem[] = [
    { icon: 'platform', label: 'Plataforma', value: product.value.platform },
  ]
  // Reuses the same per-variant regions VariantSelector shows chips for — there's no separate
  // product-level "activation region" field, and these are the regions the product actually sells in.
  const regions = [...new Set(product.value.variants.map((v) => v.region).filter((r): r is string => !!r))]
  if (regions.length) {
    items.push({
      icon: 'region',
      label: 'Puede activarse en',
      value: regions.join(' / '),
      link: product.value.activationGuideUrl ? { text: 'Consultar guía de activación', href: product.value.activationGuideUrl } : undefined,
    })
  }
  // Defaults to "Enlace de activación" — the common case for this catalog — when the product hasn't set one yet.
  items.push({ icon: 'type', label: 'Tipo', value: product.value.activationType || 'Enlace de activación' })
  return items
})

// Heuristic threshold instead of measuring rendered lines: ~55 chars/line × 4 lines at this column's width.
const DESCRIPTION_PREVIEW_LIMIT = 220
// Plain-text length (not the raw Markdown source) decides truncation — otherwise `**bold**` syntax
// would inflate the count without adding visible characters.
const descriptionPreview = computed(() => (product.value ? stripMarkdown(product.value.description) : ''))
const isDescriptionLong = computed(() => descriptionPreview.value.length > DESCRIPTION_PREVIEW_LIMIT)
const descriptionHtml = computed(() => (product.value ? renderMarkdown(product.value.description) : ''))

function scrollToFullDescription() {
  document.getElementById('full-description')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

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

    <h1 class="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{{ product.name }}</h1>

    <div class="grid items-start gap-8 lg:grid-cols-[0.85fr_1.1fr_0.85fr] lg:gap-10">
      <ProductGallery :images="images" :alt="product.name" />

      <div class="flex flex-col gap-10">
        <dl v-if="specs.length" class="flex flex-col gap-7">
          <div v-for="spec in specs" :key="spec.label" class="flex items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70">
              <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <template v-if="spec.icon === 'platform'">
                  <rect x="3" y="7" width="18" height="10" rx="3" />
                  <circle cx="8.5" cy="12" r="1" fill="currentColor" stroke="none" />
                  <circle cx="15.5" cy="12" r="1" fill="currentColor" stroke="none" />
                </template>
                <template v-else-if="spec.icon === 'region'">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c2.2 2.4 3.5 5.5 3.5 9s-1.3 6.6-3.5 9c-2.2-2.4-3.5-5.5-3.5-9s1.3-6.6 3.5-9z" />
                </template>
                <template v-else>
                  <circle cx="8" cy="15" r="3" />
                  <path d="M10.2 12.8L19 4M16 5l2.5 2.5M13.5 7.5L16 10" />
                </template>
              </svg>
            </span>
            <div class="flex flex-col gap-0.5 text-sm">
              <dt class="text-white/50">{{ spec.label }}</dt>
              <dd class="font-semibold text-white">{{ spec.value }}</dd>
              <a v-if="spec.link" :href="spec.link.href" target="_blank" rel="noopener noreferrer" class="text-xs font-medium text-accent hover:text-accent-hover">{{ spec.link.text }}</a>
            </div>
          </div>
        </dl>

        <section aria-labelledby="about-heading" class="border-t border-white/10 pt-8">
          <h2 id="about-heading" class="mb-4 text-sm font-semibold uppercase tracking-wide text-white/70">Sobre este producto</h2>
          <!-- Short descriptions render full Markdown inline; long ones show a plain-text clamp — clamping
               formatted HTML (lists, headings) would clip mid-element and look broken. -->
          <div v-if="!isDescriptionLong" class="markdown-body text-sm leading-relaxed text-white/60" v-html="descriptionHtml" />
          <p v-else class="line-clamp-4 text-sm leading-relaxed text-white/60">{{ descriptionPreview }}</p>
          <button v-if="isDescriptionLong" type="button" class="mt-2 text-sm font-medium text-accent hover:text-accent-hover" @click="scrollToFullDescription()">Leer más</button>
        </section>
      </div>

      <div class="flex flex-col gap-7 lg:sticky lg:top-24">
        <VariantSelector v-model="selectedId" :variants="product.variants" :recommended-id="recommendedId" />

        <PurchasePanel :variant="selected" :busy="buying" :added-label="feedback === 'added'" :error="errorMessage" @buy="buyNow()" @add="addToCart()" />
      </div>
    </div>

    <section v-if="isDescriptionLong" id="full-description" class="glass scroll-mt-24 rounded-2xl border border-white/10 p-6 sm:p-8">
      <h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
        <svg class="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
        Descripción completa
      </h2>
      <div class="markdown-body leading-relaxed text-white/70" v-html="descriptionHtml" />
    </section>
  </article>
</template>
