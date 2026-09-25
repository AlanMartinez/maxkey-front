<script setup lang="ts">
import { resizedImageUrl } from '~/utils/productImage'

const props = defineProps<{ images: string[]; alt: string }>()

const mainImage = computed(() => props.images[0])
const visibleThumbnails = computed(() => props.images.slice(1, 4))
const extraCount = computed(() => Math.max(props.images.length - 4, 0))

const isZoomOpen = ref(false)
const zoomIndex = ref(0)
const scrollContainer = ref<HTMLDivElement | null>(null)

function openZoom(index = 0) {
  zoomIndex.value = index
  isZoomOpen.value = true
}
function closeZoom() {
  isZoomOpen.value = false
}
function nextImage() {
  zoomIndex.value = (zoomIndex.value + 1) % props.images.length
}
function prevImage() {
  zoomIndex.value = (zoomIndex.value - 1 + props.images.length) % props.images.length
}
let scrollSettleTimer: ReturnType<typeof setTimeout> | null = null
function onModalScroll() {
  if (scrollSettleTimer) clearTimeout(scrollSettleTimer)
  scrollSettleTimer = setTimeout(() => {
    const el = scrollContainer.value
    if (!el || el.clientWidth === 0) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== zoomIndex.value) zoomIndex.value = i
  }, 120)
}
function onKeydown(event: KeyboardEvent) {
  if (!isZoomOpen.value) return
  if (event.key === 'Escape') closeZoom()
  else if (event.key === 'ArrowRight') nextImage()
  else if (event.key === 'ArrowLeft') prevImage()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

watch(zoomIndex, async (i) => {
  await nextTick()
  scrollContainer.value?.scrollTo({ left: i * scrollContainer.value.clientWidth, behavior: 'smooth' })
})
watch(isZoomOpen, async (open) => {
  if (!open) return
  await nextTick()
  scrollContainer.value?.scrollTo({ left: zoomIndex.value * scrollContainer.value.clientWidth })
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="glass group relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/5">
      <img
        v-if="mainImage"
        :src="resizedImageUrl(mainImage, 800)"
        :alt="alt"
        class="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] group-focus-within:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
      />
      <button
        v-if="mainImage"
        type="button"
        aria-label="Ver imagen completa"
        class="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100 focus-visible:opacity-100"
        @click="openZoom(0)"
      >
        <span class="glass flex h-11 w-11 items-center justify-center rounded-full text-white">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
      </button>
    </div>
    <!-- Thumbnails only make sense with a real gallery; a single image renders no empty tiles. -->
    <div v-if="images.length > 1" class="grid grid-cols-3 gap-3">
      <button
        v-for="(image, i) in visibleThumbnails"
        :key="`${i + 1}-${image}`"
        type="button"
        :aria-label="i === 2 && extraCount > 0 ? `Ver ${extraCount} imágenes más` : `Ver vista ${i + 2}`"
        class="glass group relative aspect-square overflow-hidden rounded-xl bg-white/5 transition hover:border-white/30"
        @click="openZoom(i + 1)"
      >
        <img
          :src="resizedImageUrl(image, 200)"
          :alt="`${alt} — vista ${i + 2}`"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05] group-focus-visible:scale-[1.05] motion-reduce:transform-none motion-reduce:transition-none"
        />
        <span
          v-if="i === 2 && extraCount > 0"
          class="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-semibold text-white"
        >
          +{{ extraCount }}
        </span>
        <span
          class="absolute inset-0 z-10 flex items-center justify-center bg-black/0 text-white opacity-0 transition duration-300 group-hover:bg-black/25 group-hover:opacity-100 group-focus-visible:bg-black/25 group-focus-visible:opacity-100 motion-reduce:transition-none"
          aria-hidden="true"
        >
          <span class="glass flex h-9 w-9 items-center justify-center rounded-full">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
        </span>
      </button>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="isZoomOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/80" aria-hidden="true" @click="closeZoom()" />
      <div role="dialog" aria-modal="true" :aria-label="alt" class="relative flex max-h-full w-full max-w-4xl items-center justify-center">
        <button type="button" aria-label="Cerrar" class="absolute right-0 top-0 -translate-y-full rounded-xl p-2 text-white/70 transition hover:text-white" @click="closeZoom()">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <button
          v-if="images.length > 1"
          type="button"
          aria-label="Imagen anterior"
          class="absolute left-2 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
          @click="prevImage()"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>

        <div
          ref="scrollContainer"
          class="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          @scroll="onModalScroll"
        >
          <div v-for="(image, i) in images" :key="`${i}-${image}`" class="flex w-full flex-none snap-center items-center justify-center">
            <img :src="image" :alt="`${alt} — vista ${i + 1}`" class="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain" />
          </div>
        </div>

        <button
          v-if="images.length > 1"
          type="button"
          aria-label="Imagen siguiente"
          class="absolute right-2 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
          @click="nextImage()"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

      <div v-if="images.length > 1" class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
        <span
          v-for="(image, i) in images"
          :key="`dot-${i}-${image}`"
          class="h-1.5 w-1.5 rounded-full transition"
          :class="i === zoomIndex ? 'bg-white' : 'bg-white/30'"
        />
      </div>
    </div>
  </Teleport>
</template>
