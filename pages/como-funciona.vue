<script setup lang="ts">
useHead({
  title: 'Cómo funciona · CHEKEYS',
  meta: [{ name: 'description', content: 'Comprar en CHEKEYS en cuatro pasos: elegí el producto, pagá con Mercado Pago, recibí tu clave al instante y activala.' }],
})

const steps = [
  {
    title: 'Elegí tu producto',
    detail: 'Buscá el juego, la tarjeta de regalo o la suscripción que necesitás. Cada producto indica plataforma, región y stock antes de comprar.',
  },
  {
    title: 'Pagá con Mercado Pago',
    detail: 'Te redirigimos a Mercado Pago para pagar con tarjeta, dinero en cuenta o transferencia. Nunca vemos ni guardamos los datos de tu tarjeta.',
  },
  {
    title: 'Recibí tu clave al instante',
    detail: 'Cuando el pago se acredita, la clave queda disponible en “Mis compras” y te avisamos por email.',
  },
  {
    title: 'Activá y jugá',
    detail: 'Canjeá el código en la plataforma correspondiente siguiendo las instrucciones de cada producto. Si algo falla, soporte te ayuda.',
  },
]
</script>

<template>
  <section class="mx-auto flex w-full max-w-2xl flex-col gap-14 py-4 sm:py-8">
    <header>
      <p class="text-xs font-medium uppercase tracking-[0.2em] text-accent/80">Cómo funciona</p>
      <h1 class="mt-3 text-2xl font-semibold tracking-tight text-white/90 sm:text-3xl">Comprar una clave lleva menos de dos minutos</h1>
      <p class="mt-4 max-w-lg text-sm leading-relaxed text-white/50 sm:text-base">
        Sin envíos, sin esperas. Elegís, pagás de forma segura y la clave aparece en tu cuenta lista para activar.
      </p>
    </header>

    <!-- Vertical timeline: the connecting line is drawn once behind the dots instead of per item, so the
         first and last markers never show a dangling segment. -->
    <ol class="relative flex flex-col gap-10 pl-9">
      <span class="absolute bottom-3 left-[11px] top-3 w-px bg-white/10" aria-hidden="true" />
      <li v-for="(step, index) in steps" :key="step.title" class="relative">
        <span class="absolute -left-9 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-bg text-[11px] font-medium text-accent" aria-hidden="true">
          {{ index + 1 }}
        </span>
        <h2 class="text-base font-medium text-white/90">{{ step.title }}</h2>
        <p class="mt-1.5 text-sm leading-relaxed text-white/50">{{ step.detail }}</p>
      </li>
    </ol>

    <div class="flex flex-col gap-3 border-t border-white/10 pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p class="text-white/50">¿Listo para empezar?</p>
      <NuxtLink to="/" class="inline-flex items-center gap-1.5 font-medium text-accent transition hover:text-accent-hover">
        Ver catálogo
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </NuxtLink>
    </div>
  </section>
</template>
