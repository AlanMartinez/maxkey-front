<script setup lang="ts">
import type { CarouselSlideDto } from '~/types/api'

// FALLBACK-ONLY: static slides shown when `GET /catalog/carousel` returns an empty array or the
// request fails (design D2 Data Flow) — e.g. if the frontend deploys before backend PR #29 is
// live. Never shown once the endpoint returns real slides. `productSlug: ''` routes to the catalog
// anchor instead of a real product page, since these placeholders aren't backed by one.
const FALLBACK_SLIDES: CarouselSlideDto[] = [
  { id: 'fallback-1', title: 'Riot Points con 90% de descuento', imageUrl: '/images/promos/riot-promo-text-20260913.png', productSlug: '', sortOrder: 0 },
  { id: 'fallback-2', title: 'Robux con 75% de descuento', imageUrl: '/images/promos/robux-promo-text-20260913.png', productSlug: '', sortOrder: 1 },
  { id: 'fallback-3', title: 'GTA V con 50% de descuento', imageUrl: '/images/promos/gta-promo-text-20260913.png', productSlug: '', sortOrder: 2 },
]

// Public, unauthenticated (carousel spec "Public Carousel Listing"; design D2/D6).
const api = useApi()
const { data: fetchedSlides } = await useAsyncData('carousel', () => api<CarouselSlideDto[]>('/catalog/carousel'), { default: () => [] })
const slides = computed(() => (fetchedSlides.value.length ? fetchedSlides.value : FALLBACK_SLIDES))

const active = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

function goTo(index: number) {
  active.value = (index + slides.value.length) % slides.value.length
}
const prev = () => goTo(active.value - 1)
const next = () => goTo(active.value + 1)

// Arrow keys move between slides when the tablist has focus (WAI-ARIA tabs pattern).
function onTablistKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') { event.preventDefault(); prev() }
  if (event.key === 'ArrowRight') { event.preventDefault(); next() }
}

onMounted(() => {
  if (slides.value.length > 1) timer = setInterval(next, 5000)
})
onUnmounted(() => clearInterval(timer))

const overlayButton = 'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-bg/60 text-lg text-white backdrop-blur-sm transition hover:bg-bg/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'
</script>

<template>
  <!-- The promo art is 2172x724; the fixed aspect ratio keeps the image edge-to-edge so no band shows under it. -->
  <section id="ofertas" aria-label="Ofertas destacadas" class="glass relative aspect-[2172/724] overflow-hidden rounded-3xl">
    <div v-for="(slide, i) in slides" v-show="i === active" :key="slide.id" class="absolute inset-0">
      <h1 class="sr-only">{{ slide.title }}</h1>
      <NuxtLink :to="slide.productSlug ? `/product/${slide.productSlug}` : '/#catalogo'" class="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
        <img
          :src="slide.imageUrl"
          :alt="slide.title"
          width="2172"
          height="724"
          :loading="i === 0 ? 'eager' : 'lazy'"
          class="block h-full w-full object-cover"
        >
        <span class="sr-only">Ver oferta</span>
      </NuxtLink>
    </div>

    <template v-if="slides.length > 1">
      <button type="button" aria-label="Oferta anterior" :class="overlayButton" class="left-3 sm:left-4" @click="prev()">‹</button>
      <button type="button" aria-label="Oferta siguiente" :class="overlayButton" class="right-3 sm:right-4" @click="next()">›</button>

      <div
        class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-bg/55 px-3 py-2 backdrop-blur-sm sm:bottom-5"
        role="tablist"
        aria-label="Diapositivas"
        @keydown="onTablistKeydown"
      >
        <button
          v-for="(slide, i) in slides"
          :key="slide.id"
          type="button"
          role="tab"
          :aria-selected="i === active"
          :tabindex="i === active ? 0 : -1"
          :aria-label="`Ir a la oferta ${i + 1}`"
          class="h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          :class="i === active ? 'w-6 bg-accent' : 'w-2 bg-white/30 hover:bg-white/60'"
          @click="goTo(i)"
        />
      </div>
    </template>
  </section>
</template>
