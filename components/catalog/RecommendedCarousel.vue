<script setup lang="ts">
import type { ProductSummary } from '~/types/api'

const props = defineProps<{ currentSlug: string; platform: string }>()

const api = useApi()
const { data: allProducts } = await useAsyncData(
  `recommended-${props.currentSlug}`,
  () => api<ProductSummary[]>('/catalog/products'),
  { default: () => [] },
)

const MAX_ITEMS = 16
// Same-platform products lead the list (closest to "related"); the rest of the catalog fills the
// remainder. There's no category/tag field to do real relatedness with (see types/api.ts).
const products = computed(() => {
  const others = allProducts.value.filter((p) => p.slug !== props.currentSlug)
  const samePlatform = others.filter((p) => p.platform === props.platform)
  const rest = others.filter((p) => p.platform !== props.platform)
  return [...samePlatform, ...rest].slice(0, MAX_ITEMS)
})

// Infinite-loop via edge cloning: a few real cards are duplicated on each side of the track so the
// belt keeps sliding past the "ends"; crossing into a clone snaps the position back with transitions
// off, invisibly to the eye.
const CLONE_COUNT = 4
const track = computed(() => {
  if (products.value.length <= CLONE_COUNT) return products.value
  const head = products.value.slice(0, CLONE_COUNT)
  const tail = products.value.slice(-CLONE_COUNT)
  return [...tail, ...products.value, ...head]
})

const index = ref(CLONE_COUNT)
const withTransition = ref(true)
const trackEl = ref<HTMLElement | null>(null)
// Bumped on resize to force `trackStyle` to re-read the DOM — card width (and the flex `gap`) changes
// at each breakpoint and isn't otherwise a Vue-reactive value.
const layoutTick = ref(0)

function cardStep() {
  layoutTick.value // eslint-disable-line no-unused-expressions -- reactive dependency, see comment above
  const first = trackEl.value?.children[0] as HTMLElement | undefined
  const second = trackEl.value?.children[1] as HTMLElement | undefined
  if (!first || !second) return first?.getBoundingClientRect().width ?? 0
  // offsetLeft delta includes the flex `gap`, unlike getBoundingClientRect().width alone.
  return second.offsetLeft - first.offsetLeft
}

function onResize() {
  layoutTick.value += 1
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

function next() {
  index.value += 1
}
function prev() {
  index.value -= 1
}

// After the slide animation finishes, silently jump back into the real range if we've drifted into
// clone territory — the clones are visually identical, so the jump is imperceptible.
function onTransitionEnd() {
  const total = products.value.length
  if (index.value >= total + CLONE_COUNT) {
    withTransition.value = false
    index.value -= total
  } else if (index.value < CLONE_COUNT) {
    withTransition.value = false
    index.value += total
  }
}

watch(index, () => {
  if (!withTransition.value) {
    nextTick(() => requestAnimationFrame(() => (withTransition.value = true)))
  }
})

const trackStyle = computed(() => ({
  transform: `translateX(-${index.value * cardStep()}px)`,
  transition: withTransition.value ? 'transform 400ms ease' : 'none',
}))
</script>

<template>
  <section v-if="products.length" aria-labelledby="recommended-heading" class="border-t border-white/10 pt-8">
    <h2 id="recommended-heading" class="mb-4 text-sm font-semibold uppercase tracking-wide text-white/70">Recomendados</h2>
    <div class="group relative">
      <div class="overflow-hidden">
        <div
          ref="trackEl"
          class="flex gap-5 sm:gap-6"
          :style="trackStyle"
          @transitionend="onTransitionEnd()"
        >
          <div
            v-for="(product, i) in track"
            :key="`${product.id}-${i}`"
            class="w-28 shrink-0 sm:w-36 lg:w-40"
          >
            <ProductCard :product="product" compact />
          </div>
        </div>
      </div>

      <template v-if="products.length > 1">
        <button
          type="button"
          aria-label="Anterior"
          class="absolute left-0 top-1/3 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-bg/70 text-lg text-white opacity-0 backdrop-blur-sm transition hover:bg-bg/90 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent group-hover:opacity-100"
          @click="prev()"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Siguiente"
          class="absolute right-0 top-1/3 z-10 flex h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-bg/70 text-lg text-white opacity-0 backdrop-blur-sm transition hover:bg-bg/90 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent group-hover:opacity-100"
          @click="next()"
        >
          ›
        </button>
      </template>
    </div>
  </section>
</template>
