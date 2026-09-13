<script setup lang="ts">
const slides = [
  { eyebrow: 'Oferta de la semana', title: 'Riot Points con 12% off', text: 'Recarga League of Legends y VALORANT antes del domingo.', cta: 'Ver oferta', tone: 'from-accent/50' },
  { eyebrow: 'Recarga instantánea', title: 'Robux al mejor precio de LATAM', text: 'Hasta 20% menos que la tienda oficial, acreditación en minutos.', cta: 'Explorar Robux', tone: 'from-success/40' },
  { eyebrow: 'Edición completa', title: 'GTA$ Shark Cash Card −15%', text: 'Suma dinero en el juego sin salir de Rockstar Games.', cta: 'Ver detalle', tone: 'from-red-500/40' },
]
const active = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => { active.value = (active.value + 1) % slides.length }, 5000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <section id="ofertas" aria-label="Ofertas destacadas" class="glass rounded-3xl bg-gradient-to-br to-surface p-8 sm:p-12" :class="slides[active]?.tone">
    <div v-for="(slide, i) in slides" v-show="i === active" :key="slide.title" class="max-w-xl">
      <p class="text-sm font-medium text-white/70">{{ slide.eyebrow }}</p>
      <h1 class="mt-2 text-3xl font-bold sm:text-5xl">{{ slide.title }}</h1>
      <p class="mt-3 text-white/70">{{ slide.text }}</p>
      <NuxtLink to="/#catalogo" class="mt-6 inline-flex h-12 items-center rounded-xl bg-accent px-6 font-medium text-white shadow-[0_0_24px_rgba(124,92,252,0.35)] transition hover:bg-accent-hover">
        {{ slide.cta }}
      </NuxtLink>
    </div>
    <div class="mt-8 flex gap-2" role="tablist" aria-label="Diapositivas">
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
