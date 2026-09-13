<script setup lang="ts">
const slides = [
  { title: 'Riot Points con 90% de descuento', alt: 'Solo por hoy. Riot Points: 90% de descuento. Aprovechá ahora.', cta: 'Ver oferta', image: '/images/promos/riot-promo-text-20260913.png' },
  { title: 'Robux con 75% de descuento', alt: 'Robux: 75% de descuento. Aprovechá ahora.', cta: 'Explorar Robux', image: '/images/promos/robux-promo-text-20260913.png' },
  { title: 'GTA V con 50% de descuento', alt: 'Solo por hoy. GTA V: 50% de descuento. Aprovechá ahora.', cta: 'Ver detalle', image: '/images/promos/gta-promo-text-20260913.png' },
]
const active = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => { active.value = (active.value + 1) % slides.length }, 5000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <section id="ofertas" aria-label="Ofertas destacadas" class="glass overflow-hidden rounded-3xl">
    <div v-for="(slide, i) in slides" v-show="i === active" :key="slide.title">
      <h1 class="sr-only">{{ slide.title }}</h1>
      <NuxtLink to="/#catalogo" class="block focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
        <img
          :src="slide.image"
          :alt="slide.alt"
          width="2172"
          height="724"
          class="block h-auto w-full object-contain"
        >
        <span class="sr-only">{{ slide.cta }}</span>
      </NuxtLink>
    </div>
    <div class="flex justify-center gap-2 p-4" role="tablist" aria-label="Diapositivas">
      <button
        v-for="(slide, i) in slides"
        :key="slide.title"
        type="button"
        role="tab"
        :aria-selected="i === active"
        :aria-label="`Ir a la oferta ${i + 1}`"
        class="h-2 rounded-full transition-all"
        :class="i === active ? 'w-8 bg-accent' : 'w-2 bg-white/30 hover:bg-white/60'"
        @click="active = i"
      />
    </div>
  </section>
</template>
