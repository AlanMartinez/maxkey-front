<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] })
useHead({ title: 'Admin · Nexo' })
</script>

<template>
  <section class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Panel de administración</h1>
    <nav class="grid gap-4 sm:grid-cols-3">
      <NuxtLink to="/admin/catalog" class="glass flex flex-col gap-2 rounded-2xl p-6 transition hover:border-accent/50">
        <h2 class="text-lg font-semibold">Catálogo</h2>
        <p class="text-sm text-white/60">Editar productos y variantes.</p>
      </NuxtLink>
      <NuxtLink to="/admin/carousel" class="glass flex flex-col gap-2 rounded-2xl p-6 transition hover:border-accent/50">
        <h2 class="text-lg font-semibold">Carrusel</h2>
        <p class="text-sm text-white/60">Gestionar las diapositivas de ofertas.</p>
      </NuxtLink>
      <NuxtLink to="/admin/buyers" class="glass flex flex-col gap-2 rounded-2xl p-6 transition hover:border-accent/50">
        <h2 class="text-lg font-semibold">Compradores</h2>
        <p class="text-sm text-white/60">Ver compradores y reenviar emails de entrega.</p>
      </NuxtLink>
    </nav>
  </section>
</template>
