<script setup lang="ts">
import type { ProductDetail, ProductSummary } from '~/types/api'
import { productImageUrl } from '~/utils/productImage'
import { defaultVariant, toCartLine } from '~/utils/cartLine'

const props = defineProps<{ product: ProductSummary }>()

const discount = computed(() =>
  props.product.oldPrice ? Math.round((1 - props.product.fromPrice / props.product.oldPrice) * 100) : 0,
)

const api = useApi()
const cart = useCart()
type Feedback = 'added' | 'max-items' | 'error' | null
const adding = ref(false)
const feedback = ref<Feedback>(null)
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
onUnmounted(() => clearTimeout(feedbackTimer))

function showFeedback(value: Feedback) {
  feedback.value = value
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => (feedback.value = null), 1500)
}

// The summary DTO carries no variant ids, so the default variant is resolved from the detail endpoint on demand.
async function addDefaultVariant() {
  if (adding.value) return
  adding.value = true
  try {
    const detail = await api<ProductDetail>(`/catalog/products/${props.product.slug}`)
    const variant = defaultVariant(detail.variants)
    if (!variant) return showFeedback('error')
    const result = cart.add(toCartLine(detail, variant))
    if (result.ok) cart.open()
    showFeedback(result.ok ? 'added' : result.reason)
  } catch {
    showFeedback('error')
  } finally {
    adding.value = false
  }
}

const buttonLabel = computed(() => {
  if (feedback.value === 'added') return 'Agregado ✓'
  if (feedback.value === 'max-items') return 'Carrito lleno'
  if (feedback.value === 'error') return 'No se pudo agregar'
  return 'Agregar al carrito'
})
</script>

<template>
  <!-- Below `sm` the card sits three-per-row on a phone (~110px wide), so paddings, type and the
       add button collapse; the button keeps its label for screen readers but shows icon only. -->
  <article class="glass flex flex-col overflow-hidden rounded-xl border-0 transition duration-200 hover:z-10 hover:scale-[1.04] hover:shadow-xl hover:shadow-black/40 sm:rounded-2xl">
    <!-- The link covers image and copy; the add button stays a sibling so it never triggers navigation. -->
    <NuxtLink :to="`/product/${product.slug}`" class="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
      <div class="relative aspect-[3/4] overflow-hidden bg-white/5">
        <img :src="productImageUrl(product)" :alt="product.name" loading="lazy" class="h-full w-full object-cover" />
      </div>
      <div class="flex flex-1 flex-col gap-1.5 p-2.5 pb-2 sm:gap-2 sm:p-3 sm:pb-2">
        <h3 class="line-clamp-2 text-sm font-semibold leading-tight">{{ product.name }}</h3>
        <!-- A 16px mark fits the ~110px phone card where the old text badge had to wait for `sm`. -->
        <div class="flex items-center">
          <PlatformLogo :platform="product.platform" />
        </div>
        <div class="mt-auto flex flex-col gap-1 text-xs sm:text-sm">
          <p class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span class="hidden text-white/50 sm:inline">Desde</span>
            <span class="text-base font-semibold">{{ formatMoney(product.fromPrice) }}</span>
            <AppBadge v-if="discount > 0" tone="discount">-{{ discount }}%</AppBadge>
          </p>
          <p v-if="product.oldPrice" class="text-white/40 line-through">{{ formatMoney(product.oldPrice) }}</p>
        </div>
      </div>
    </NuxtLink>
    <div class="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
      <AppButton
        variant="ghost"
        size="sm"
        class="w-full hover:border-accent hover:text-accent"
        :loading="adding"
        :aria-label="buttonLabel"
        :aria-live="feedback ? 'polite' : undefined"
        :class="{ 'border-success/60 text-success': feedback === 'added', 'border-red-400/60 text-red-300': feedback === 'max-items' || feedback === 'error' }"
        @click.stop.prevent="addDefaultVariant()"
      >
        <CartIcon v-if="!adding" />
        <span class="hidden sm:inline">{{ buttonLabel }}</span>
      </AppButton>
    </div>
  </article>
</template>
