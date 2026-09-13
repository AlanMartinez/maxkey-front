<script setup lang="ts">
const links = [
  { label: 'Catálogo', to: '/' },
  { label: 'Ofertas', to: '/#ofertas' },
  { label: 'Ayuda', to: '/#ayuda' },
]
</script>

<template>
  <header class="glass sticky top-0 z-40 border-x-0 border-t-0">
    <div class="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4">
      <NuxtLink to="/" class="font-display text-xl font-bold tracking-tight text-accent">Nexo</NuxtLink>
      <nav class="hidden items-center gap-5 text-sm text-white/70 md:flex" aria-label="Principal">
        <NuxtLink v-for="link in links" :key="link.label" :to="link.to" class="transition hover:text-white">
          {{ link.label }}
        </NuxtLink>
      </nav>
      <label class="relative ml-auto hidden w-full max-w-xs sm:block">
        <span class="sr-only">Buscar</span>
        <input type="search" placeholder="Buscar juegos, tarjetas..." class="w-full rounded-xl border border-white/10 bg-bg/60 px-4 py-2 text-sm placeholder:text-white/40 focus:border-accent focus:outline-none" />
      </label>
      <button type="button" aria-label="Carrito" class="relative rounded-xl p-2 text-white/80 transition hover:bg-white/5 hover:text-white">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6.2" />
          <circle cx="10" cy="20" r="1" /><circle cx="17" cy="20" r="1" />
        </svg>
        <!-- Cart count badge (PR15) -->
        <slot name="cart-count" />
      </button>
      <slot name="account">
        <AppButton variant="ghost" size="sm">Ingresar</AppButton>
      </slot>
    </div>
  </header>
</template>
