<script setup lang="ts">
import type { Ref } from 'vue'
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

type SpecItem = { icon: 'platform' | 'region' | 'type'; label: string; value: string; action?: { text: string; href: string } }

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
      action: product.value.activationGuideSlug ? { text: 'Consultar guía de activación', href: `/article/${product.value.activationGuideSlug}` } : undefined,
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
  <Skeleton v-if="status === 'pending'" class="h-96 w-full" />
  <ErrorState v-else-if="!product">
    <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
  </ErrorState>
  <article v-else class="flex flex-col gap-6 sm:gap-8 lg:gap-10">
    <nav aria-label="Migas de pan" class="text-sm text-white/50">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/" class="transition hover:text-white">Inicio</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li><NuxtLink :to="{ path: '/', query: { platform: product.platform } }" class="transition hover:text-white">{{ product.platform }}</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li class="min-w-0 truncate text-white/80" aria-current="page">{{ product.name }}</li>
      </ol>
    </nav>

    <h1 class="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">{{ product.name }}</h1>

    <!-- Below `lg` the three columns stack; `order-*` puts the variant picker right under the gallery
         (where a buyer looks first) and pushes specs/description below it. -->
    <div class="grid items-start gap-6 sm:gap-8 lg:grid-cols-[0.85fr_1.1fr_0.85fr] lg:gap-10">
      <div class="mx-auto w-full max-w-xs lg:max-w-none">
        <ProductGallery :images="images" :alt="product.name" />
      </div>

      <div class="order-3 flex flex-col gap-8 lg:order-none lg:gap-10">
        <!-- Two specs per row on phones/tablets; desktop keeps the vertical list in its column. -->
        <dl v-if="specs.length" class="grid grid-cols-2 gap-5 lg:flex lg:flex-col lg:gap-7">
          <div v-for="spec in specs" :key="spec.label" class="flex items-start gap-2.5 lg:gap-3">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 lg:h-9 lg:w-9">
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
              <dd class="font-semibold text-white">
                <PlatformLogo v-if="spec.icon === 'platform'" :platform="spec.value" size="md" />
                <template v-else>{{ spec.value }}</template>
              </dd>
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
          <PurchasePanel :variant="selected" :busy="buying" :added-label="feedback === 'added'" :error="errorMessage" @buy="buyNow()" @add="addToCart()" />
        </div>
        <div class="hidden lg:block">
          <SecurePaymentBadge />
        </div>
        <div class="border-y border-white/10 py-4 lg:hidden">
          <TrustBadges compact />
        </div>
      </div>
    </div>

    <CollapsibleSection v-if="isDescriptionLong" id="full-description" v-model:open="fullDescriptionOpen" title="Descripción completa">
      <template #icon>
        <svg class="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      </template>
      <div class="markdown-body text-sm leading-relaxed text-white/70" v-html="descriptionHtml" />
    </CollapsibleSection>

    <PurchaseBar
      v-model="selectedId"
      :variants="product.variants"
      :recommended-id="recommendedId"
      :variant="selected"
      :busy="buying"
      :added-label="feedback === 'added'"
      :error="errorMessage"
      @buy="buyNow()"
      @add="addToCart()"
    />
  </article>
</template>
