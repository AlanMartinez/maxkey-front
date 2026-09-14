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
  <article class="glass group flex flex-col overflow-hidden rounded-2xl transition hover:border-accent/50">
    <!-- The link covers image and copy; the add button stays a sibling so it never triggers navigation. -->
    <NuxtLink :to="`/product/${product.slug}`" class="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
      <div class="relative aspect-[4/3] overflow-hidden bg-white/5">
        <img :src="productImageUrl(product)" :alt="product.name" loading="lazy" class="h-full w-full object-cover transition group-hover:scale-105" />
        <AppBadge tone="accent" class="absolute left-3 top-3">{{ product.platform }}</AppBadge>
        <AppBadge v-if="discount > 0" tone="success" class="absolute right-3 top-3">-{{ discount }}%</AppBadge>
      </div>
      <div class="flex flex-1 flex-col gap-2 p-4 pb-3">
        <h3 class="font-semibold leading-tight">{{ product.name }}</h3>
        <p class="mt-auto flex items-baseline gap-2 text-sm">
          <span class="text-white/50">Desde</span>
          <span class="text-lg font-semibold">{{ formatMoney(product.fromPrice) }}</span>
          <span v-if="product.oldPrice" class="text-white/40 line-through">{{ formatMoney(product.oldPrice) }}</span>
        </p>
      </div>
    </NuxtLink>
    <div class="px-4 pb-4">
      <AppButton
        variant="ghost"
        size="sm"
        class="w-full hover:border-accent hover:text-accent"
        :loading="adding"
        :aria-live="feedback ? 'polite' : undefined"
        :class="{ 'border-success/60 text-success': feedback === 'added', 'border-red-400/60 text-red-300': feedback === 'max-items' || feedback === 'error' }"
        @click.stop.prevent="addDefaultVariant()"
      >
        <CartIcon v-if="!adding" />
        {{ buttonLabel }}
      </AppButton>
    </div>
  </article>
</template>
