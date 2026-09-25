<script setup lang="ts">
import type { NuxtError } from '#app'
import { whatsappUrl } from '~/utils/contact'

// Branded error page (replaces the old redirect to the marketing domain). Keeps the same chrome as
// app.vue so a broken link still looks like CHEKEYS and the buyer can reach the cart, login or footer.
const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)
const copy = computed(() => (isNotFound.value
  ? { title: 'No encontramos esta página', detail: 'El link puede estar vencido o mal escrito.', cta: 'Ir al catálogo' }
  : { title: 'Algo salió mal', detail: 'Tuvimos un problema al cargar esta página. Si el error sigue, escribinos y lo revisamos.', cta: 'Volver al inicio' }))

useHead({ title: () => `${copy.value.title} · Chekeys` })

const helpHref = whatsappUrl('Hola, llegué a una página que no existe en CHEKEYS y necesito ayuda')

function goHome() {
  return clearError({ redirect: '/' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <main class="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-6 sm:py-8">
      <section class="glass flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center" data-testid="error-card">
        <p class="font-display text-5xl font-bold text-white/20" aria-hidden="true">{{ error.statusCode }}</p>
        <h1 class="text-2xl font-bold">{{ copy.title }}</h1>
        <p class="max-w-sm text-sm text-white/60">{{ copy.detail }}</p>
        <div class="mt-2 flex flex-wrap justify-center gap-3">
          <AppButton @click="goHome()">{{ copy.cta }}</AppButton>
        </div>
        <a v-if="isNotFound" :href="helpHref" target="_blank" rel="noopener" class="mt-2 text-xs text-white/50 transition hover:text-white">
          ¿Buscabas algo puntual? Escribinos por WhatsApp
        </a>
      </section>
    </main>
    <AppFooter />
    <CartDrawer />
    <LoginDialog />
    <AppToast />
  </div>
</template>
