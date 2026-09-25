<script setup lang="ts">
import type { Ref } from 'vue'
import type { ProductDetail } from '~/types/api'
import type { ApiError } from '~/composables/useApi'
import { defaultVariant, galleryImages, recommendedVariant, toCartLine } from '~/utils/cartLine'
import { PLACEHOLDER_IMAGE, productImageUrl } from '~/utils/productImage'
import { renderMarkdown, stripMarkdown } from '~/utils/markdown'
import { SITE_DESCRIPTION, SITE_NAME } from '~/utils/business'

const slug = useRoute().params.slug as string
const api = useApi()

// Summary cached when a catalog card was clicked: lets name, image and price paint before the detail arrives.
const preview = useProductPreview().get(slug)

// Catalog spec: Product Detail Lookup (GET /catalog/products/{slug}; unknown or inactive slug → 404).
// SSR still awaits the detail (SEO, real 404); client navigation is lazy so the route switches instantly.
const { data: product, status, error, refresh } = await useAsyncData(`product-${slug}`, () => api<ProductDetail>(`/catalog/products/${slug}`), {
  lazy: import.meta.client,
})

const notFound = () => {
  const httpStatus = error.value?.statusCode ?? (error.value?.cause as ApiError | undefined)?.status
  return httpStatus === 404
}
const NOT_FOUND = { statusCode: 404, statusMessage: 'Producto no encontrado', fatal: true }
if (notFound()) throw createError(NOT_FOUND)
watch(error, () => {
  if (notFound()) showError(NOT_FOUND)
})

const detailLoading = computed(() => !product.value && status.value !== 'error')
const view = computed(() => product.value ?? preview)

// Meta description is the plain-text description (Markdown stripped) clipped to the ~160 chars search engines show.
const SEO_DESCRIPTION_LIMIT = 160
const seoDescription = computed(() => (product.value ? stripMarkdown(product.value.description).slice(0, SEO_DESCRIPTION_LIMIT) : SITE_DESCRIPTION))
const seo = useSeo(() => ({
  title: view.value?.name ?? SITE_NAME,
  description: seoDescription.value,
  path: `/product/${slug}`,
  image: product.value ? galleryImages(product.value)[0] : undefined,
  type: 'product',
}))

// schema.org Product so search results can show price/availability. `<` is escaped so a description
// can never close the script tag early.
const productJsonLd = computed(() => {
  if (!product.value) return ''
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.value.name,
    image: seo.image(),
    description: seoDescription.value,
    sku: product.value.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ARS',
      price: product.value.fromPrice,
      availability: 'https://schema.org/InStock',
      url: seo.url(),
    },
  }).replace(/</g, '\\u003c')
})
useHead({ script: [{ type: 'application/ld+json', innerHTML: productJsonLd }] })

const selectedId = ref<string | null>(defaultVariant(product.value?.variants ?? [])?.id ?? null)
const selected = computed(() => product.value?.variants.find((v) => v.id === selectedId.value) ?? defaultVariant(product.value?.variants ?? []))
const recommendedId = computed(() => recommendedVariant(product.value?.variants ?? [])?.id ?? null)
const images = computed(() => {
  if (!product.value) return view.value ? [productImageUrl(view.value)] : []
  const base = galleryImages(product.value)
  // DEV-ONLY: pads with placeholders so the thumbnail/gallery UI can be previewed before real
  // multi-image data exists. `import.meta.dev` is dead-code-eliminated in production builds, so
  // real buyers never see fake thumbnails.
  if (import.meta.dev && base.length && base.length < 4) {
    return [...base, ...Array.from({ length: 4 - base.length }, () => PLACEHOLDER_IMAGE)]
  }
  return base
})

type SpecItem = {
  icon: 'platform' | 'region' | 'type'
  label: string
  value: string
  caption?: string
  captionItalic?: boolean
  action?: { text: string; href: string }
}

// Static legend shown under "Tipo" regardless of which value is selected.
const TYPE_LEGEND = 'Esta es una edición digital del producto (CD-KEY).\nEntrega inmediata.'

const specs = computed<SpecItem[]>(() => {
  if (!product.value) return []
  const items: SpecItem[] = [
    {
      icon: 'platform',
      label: '',
      value: product.value.platform,
      caption: `Se activa en ${product.value.platform}`,
      action: product.value.activationGuideSlug ? { text: 'Consulta la guía de activación', href: `/article/${product.value.activationGuideSlug}` } : undefined,
    },
  ]
  // Reuses the same per-variant regions VariantSelector shows chips for — there's no separate
  // product-level "activation region" field, and these are the regions the product actually sells in.
  const regions = [...new Set(product.value.variants.map((v) => v.region).filter((r): r is string => !!r))]
  if (regions.length) {
    items.push({ icon: 'region', label: 'Puede activarse en', value: regions.join(' / ') })
  }
  // Defaults to "Enlace de activación" — the common case for this catalog — when the product hasn't set one yet.
  items.push({ icon: 'type', label: 'Tipo', value: product.value.activationType || 'Enlace de activación', caption: TYPE_LEGEND, captionItalic: true })
  return items
})

// Heuristic threshold instead of measuring rendered lines: ~55 chars/line × 4 lines at this column's width.
const DESCRIPTION_PREVIEW_LIMIT = 220
// Plain-text length (not the raw Markdown source) decides truncation — otherwise `**bold**` syntax
// would inflate the count without adding visible characters.
const descriptionPreview = computed(() => (product.value ? stripMarkdown(product.value.description) : ''))
const isDescriptionLong = computed(() => descriptionPreview.value.length > DESCRIPTION_PREVIEW_LIMIT)
const descriptionHtml = computed(() => (product.value ? renderMarkdown(product.value.description) : ''))

const fullDescriptionOpen = ref(false)

// Expands the section before scrolling so the target has its final height when the scroll lands.
function revealSection(openRef: Ref<boolean>, id: string) {
  openRef.value = true
  nextTick(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
function scrollToFullDescription() {
  revealSection(fullDescriptionOpen, 'full-description')
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
  <ErrorState v-if="!product && status === 'error'">
    <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
  </ErrorState>
  <!-- No cached summary (deep link, external nav): skeleton mirrors the real layout so nothing jumps. -->
  <div v-else-if="!view" class="flex flex-col gap-6 sm:gap-8 lg:gap-10" aria-busy="true">
    <Skeleton class="h-4 w-48" />
    <Skeleton class="h-9 w-3/4 max-w-xl" />
    <div class="grid items-start gap-6 sm:gap-8 lg:grid-cols-[0.85fr_1.1fr_0.85fr] lg:gap-10">
      <Skeleton class="mx-auto aspect-[3/4] w-full max-w-xs lg:max-w-none" />
      <div class="order-3 flex flex-col gap-4 lg:order-none">
        <Skeleton v-for="n in 3" :key="n" class="h-12 w-full" />
        <Skeleton class="mt-4 h-24 w-full" />
      </div>
      <Skeleton class="order-2 hidden h-72 w-full lg:order-none lg:block" />
    </div>
  </div>
  <article v-else class="flex flex-col gap-6 sm:gap-8 lg:gap-10">
    <nav aria-label="Migas de pan" class="text-sm text-white/50">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/" class="transition hover:text-white">Inicio</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li><NuxtLink :to="{ path: '/', query: { platform: view.platform } }" class="transition hover:text-white">{{ view.platform }}</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li class="min-w-0 truncate text-white/80" aria-current="page">{{ view.name }}</li>
      </ol>
    </nav>

    <h1 class="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">{{ view.name }}</h1>

    <!-- Below `lg` the three columns stack; `order-*` puts the variant picker right under the gallery
         (where a buyer looks first) and pushes specs/description below it. -->
    <div class="grid items-start gap-6 sm:gap-8 lg:grid-cols-[0.85fr_1.1fr_0.85fr] lg:gap-10">
      <div class="mx-auto w-full max-w-xs lg:max-w-none">
        <ProductGallery :images="images" :alt="view.name" />
      </div>

      <div v-if="detailLoading" class="order-3 flex flex-col gap-8 lg:order-none lg:gap-10" aria-busy="true">
        <div class="grid grid-cols-2 gap-5 lg:flex lg:flex-col lg:gap-7">
          <Skeleton v-for="n in 3" :key="n" class="h-12 w-full" />
        </div>
        <div class="flex flex-col gap-2 border-t border-white/10 pt-8">
          <Skeleton class="mb-2 h-4 w-40" />
          <Skeleton v-for="n in 4" :key="n" class="h-3 w-full rounded" />
        </div>
      </div>
      <div v-else-if="product" class="order-3 flex flex-col gap-8 lg:order-none lg:gap-10">
        <!-- Two specs per row on phones/tablets; desktop keeps the vertical list in its column. -->
        <dl v-if="specs.length" class="grid grid-cols-2 gap-5 lg:flex lg:flex-col lg:gap-7">
          <div v-for="spec in specs" :key="spec.icon" class="flex items-start gap-2.5 lg:gap-3">
            <PlatformLogo v-if="spec.icon === 'platform'" :platform="spec.value" size="md" class="shrink-0" />
            <span v-else class="flex h-8 w-8 shrink-0 items-center justify-center text-white/70 lg:h-9 lg:w-9">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <template v-if="spec.icon === 'region'">
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
              <dt v-if="spec.label" class="text-white/50">{{ spec.label }}</dt>
              <dd class="font-semibold text-white">{{ spec.value }}</dd>
              <p v-if="spec.caption" class="whitespace-pre-line text-xs text-white/50" :class="{ italic: spec.captionItalic }">{{ spec.caption }}</p>
              <NuxtLink v-if="spec.action" :to="spec.action.href" class="self-start text-xs font-medium text-accent hover:text-accent-hover">{{ spec.action.text }}</NuxtLink>
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

      <div class="order-2 flex flex-col gap-6 lg:order-none lg:sticky lg:top-24 lg:gap-7">
        <!-- Desktop keeps the full panel in the sticky column; phones/tablets get it inside the
             floating PurchaseBar at the end of the article, so only the reassurance lines stay here.
             One variant per product now (business rule), so there is nothing left to pick here. -->
        <div class="hidden lg:block">
          <PurchasePanel :product-name="view.name" :variant="selected" :loading="detailLoading" :busy="buying" :added-label="feedback === 'added'" :error="errorMessage" @buy="buyNow()" @add="addToCart()" />
        </div>
        <div class="hidden lg:block">
          <SecurePaymentBadge />
        </div>
        <div class="border-y border-white/10 py-4 lg:hidden">
          <TrustBadges compact />
        </div>
      </div>
    </div>

    <RecommendedCarousel :current-slug="view.slug" :platform="view.platform" />

    <CollapsibleSection v-if="isDescriptionLong" id="full-description" v-model:open="fullDescriptionOpen" title="Descripción completa">
      <template #icon>
        <svg class="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      </template>
      <div class="markdown-body text-sm leading-relaxed text-white/70" v-html="descriptionHtml" />
    </CollapsibleSection>

    <PurchaseBar
      :product-name="view.name"
      v-model="selectedId"
      :variants="product?.variants"
      :recommended-id="recommendedId"
      :variant="selected"
      :loading="detailLoading"
      :busy="buying"
      :added-label="feedback === 'added'"
      :error="errorMessage"
      @buy="buyNow()"
      @add="addToCart()"
    />
  </article>
</template>
