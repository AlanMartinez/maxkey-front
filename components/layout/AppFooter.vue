<script setup lang="ts">
import { SUPPORT_EMAIL, whatsappUrl } from '~/utils/contact'

const whatsappHref = whatsappUrl('Hola, necesito ayuda con mi compra en CHEKEYS')

const helpLinks = [
  { label: 'Cómo funciona', to: '/como-funciona' },
  { label: 'Preguntas frecuentes', to: '/ayuda' },
  { label: 'Contacto', to: '/contacto' },
]
const legalLinks = [
  { label: 'Términos y condiciones', to: '/terminos' },
  { label: 'Política de privacidad', to: '/privacidad' },
  { label: 'Política de reembolsos', to: '/reembolsos' },
]
const footerLink = 'text-white/60 transition hover:text-white'
</script>

<template>
  <footer class="border-t border-white/10 text-sm text-white/60">
    <div class="mx-auto w-full max-w-6xl px-4">
      <div class="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div class="sm:col-span-2 lg:col-span-1">
          <NuxtLink to="/" class="inline-flex" aria-label="CHEKEYS">
            <img src="/images/logo/logo_letras.png" alt="CHEKEYS" class="h-9 w-auto" />
          </NuxtLink>
          <p class="mt-4 max-w-xs leading-relaxed text-white/50">
            Claves digitales para juegos, tarjetas de regalo y suscripciones, con entrega inmediata y pago protegido.
          </p>
        </div>

        <nav aria-label="Ayuda">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-white/80">Ayuda</h2>
          <ul class="mt-4 flex flex-col gap-2.5">
            <li v-for="link in helpLinks" :key="link.to"><NuxtLink :to="link.to" :class="footerLink">{{ link.label }}</NuxtLink></li>
          </ul>
        </nav>

        <nav aria-label="Legal">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-white/80">Legal</h2>
          <ul class="mt-4 flex flex-col gap-2.5">
            <li v-for="link in legalLinks" :key="link.to"><NuxtLink :to="link.to" :class="footerLink">{{ link.label }}</NuxtLink></li>
          </ul>
        </nav>

        <div>
          <h2 class="text-xs font-semibold uppercase tracking-wider text-white/80">Contacto</h2>
          <ul class="mt-4 flex flex-col gap-2.5">
            <li><a :href="`mailto:${SUPPORT_EMAIL}`" :class="footerLink">{{ SUPPORT_EMAIL }}</a></li>
            <li><a :href="whatsappHref" target="_blank" rel="noopener" :class="footerLink">WhatsApp</a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>
