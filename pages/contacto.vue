<script setup lang="ts">
import { SUPPORT_EMAIL, SUPPORT_HOURS, whatsappUrl } from '~/utils/contact'

useSeo({
  title: 'Contacto',
  description: 'Soporte de CHEKEYS por email y WhatsApp. Incluí tu número de orden para una respuesta más rápida.',
  path: '/contacto',
})

const whatsappHref = whatsappUrl('Hola, necesito ayuda con mi compra en CHEKEYS')

const channels = [
  {
    title: 'Email',
    detail: 'Reclamos con capturas o consultas que no urgen.',
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    response: 'Dentro de las 24 h hábiles',
    icon: 'mail',
    external: false,
  },
  {
    title: 'WhatsApp',
    detail: 'Consultas rápidas sobre una compra o una key.',
    value: 'Abrir chat',
    href: whatsappHref,
    response: 'En minutos, dentro del horario de atención',
    icon: 'chat',
    external: true,
  },
] as const

const tips = [
  'Incluí el número de orden: lo encontrás en el email de confirmación y, si iniciaste sesión, en “Mis compras”.',
  'Si una key falla, adjuntá una captura del mensaje de error de la plataforma.',
  'Indicá la región de tu cuenta en la plataforma donde intentás canjear.',
]
</script>

<template>
  <section class="mx-auto flex w-full max-w-2xl flex-col gap-14 py-4 sm:py-8">
    <header>
      <p class="text-xs font-medium uppercase tracking-[0.2em] text-accent/80">Contacto</p>
      <h1 class="mt-3 text-2xl font-semibold tracking-tight text-white/90 sm:text-3xl">Estamos para ayudarte</h1>
      <p class="mt-4 max-w-lg text-sm leading-relaxed text-white/50 sm:text-base">
        Horario de atención: {{ SUPPORT_HOURS }}. Fuera de ese horario podés escribirnos igual: respondemos apenas volvemos.
      </p>
    </header>

    <ul class="divide-y divide-white/10 border-y border-white/10">
      <li v-for="channel in channels" :key="channel.title">
        <a
          :href="channel.href"
          :target="channel.external ? '_blank' : undefined"
          :rel="channel.external ? 'noopener' : undefined"
          class="group flex items-start gap-4 py-6 transition sm:items-center"
        >
          <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition group-hover:border-accent/40 group-hover:text-accent sm:mt-0">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <template v-if="channel.icon === 'mail'">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </template>
              <path v-else d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.4A8 8 0 1 1 21 12z" />
            </svg>
          </span>
          <div class="flex-1 min-w-0">
            <h2 class="text-base font-medium text-white/90">{{ channel.title }}</h2>
            <p class="mt-0.5 text-sm text-white/50">{{ channel.detail }}</p>
            <p class="mt-1 text-xs text-white/35">{{ channel.response }}</p>
          </div>
          <span class="shrink-0 text-sm font-medium text-accent transition group-hover:text-accent-hover">{{ channel.value }}</span>
        </a>
      </li>
    </ul>

    <div class="text-sm">
      <h2 class="text-xs font-medium uppercase tracking-[0.2em] text-white/40">Para resolverlo más rápido</h2>
      <ul class="mt-4 flex flex-col gap-2.5 text-white/50">
        <li v-for="tip in tips" :key="tip" class="flex gap-3 leading-relaxed">
          <span class="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" aria-hidden="true" />
          <span>{{ tip }}</span>
        </li>
      </ul>
      <p class="mt-8 text-white/40">
        Quizás tu duda ya esté resuelta en las
        <NuxtLink to="/ayuda" class="text-accent transition hover:text-accent-hover">preguntas frecuentes</NuxtLink>.
        Si querés revocar una compra, usá el
        <NuxtLink to="/arrepentimiento" class="text-accent transition hover:text-accent-hover">botón de arrepentimiento</NuxtLink>.
      </p>
    </div>
  </section>
</template>
