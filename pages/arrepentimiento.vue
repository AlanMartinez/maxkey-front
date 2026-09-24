<script setup lang="ts">
import type { LegalSection } from '~/components/legal/LegalArticle.vue'
import { WITHDRAWAL_DAYS } from '~/utils/business'
import { SUPPORT_EMAIL, SUPPORT_HOURS, whatsappUrl } from '~/utils/contact'

useSeo({
  title: 'Botón de arrepentimiento',
  description: `Revocá tu compra en CHEKEYS dentro de los ${WITHDRAWAL_DAYS} días corridos (Ley 24.240, art. 34) mientras la clave digital («key») no haya sido revelada ni canjeada.`,
  path: '/arrepentimiento',
})

const sections: LegalSection[] = [
  {
    id: 'derecho',
    title: 'Tu derecho a arrepentirte',
    paragraphs: [
      `Por la Ley 24.240 de Defensa del Consumidor (art. 34) y la Resolución 424/2020 de la Secretaría de Comercio Interior, podés revocar una compra hecha a distancia dentro de los ${WITHDRAWAL_DAYS} días corridos desde la fecha de compra, sin costo ni necesidad de justificar el motivo.`,
      'Este botón existe para que puedas ejercer ese derecho de forma simple. Al recibir tu solicitud te enviamos un comprobante por email con el número de trámite.',
    ],
  },
  {
    id: 'keys',
    title: 'Cómo aplica a las keys',
    paragraphs: [
      'Las claves digitales («keys») son bienes de un solo uso: una vez reveladas no pueden volver a venderse. Por eso el arrepentimiento aplica únicamente mientras la key NO haya sido revelada en “Mis compras” ni canjeada en la plataforma.',
      'Si la key ya fue revelada, el arrepentimiento no procede; en ese caso rigen las condiciones de la Política de reembolsos (reemplazo o reintegro solo si la plataforma la rechaza como inválida).',
    ],
    links: [{ label: 'Ver política de reembolsos', to: '/reembolsos' }],
  },
  {
    id: 'despues',
    title: 'Qué pasa después',
    paragraphs: [
      'Verificamos que la key no haya sido revelada ni canjeada y, si corresponde, la anulamos y emitimos el reintegro total a través de Mercado Pago, al mismo medio de pago que usaste. El tiempo de acreditación depende de tu banco o emisor y suele ser de 5 a 15 días hábiles.',
    ],
  },
]

const orderId = ref('')
const email = ref('')
const canSend = computed(() => orderId.value.trim().length > 0 && email.value.trim().length > 0)
const message = computed(() => `Quiero ejercer el botón de arrepentimiento. Orden ${orderId.value.trim()}, email ${email.value.trim()}`)
const whatsappHref = computed(() => whatsappUrl(message.value))
const mailHref = computed(() => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Botón de arrepentimiento')}&body=${encodeURIComponent(message.value)}`)

const inputClass = 'w-full rounded-xl border border-white/10 bg-bg/60 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none'
</script>

<template>
  <LegalArticle
    title="Botón de arrepentimiento"
    :subtitle="`Revocá tu compra dentro de los ${WITHDRAWAL_DAYS} días corridos, mientras la key no haya sido revelada.`"
    updated-at="23 de septiembre de 2026"
    :sections="sections"
  >
    <section id="formulario" class="mt-10 scroll-mt-24 border-t border-white/10 pt-10" aria-labelledby="withdrawal-form-title">
      <h2 id="withdrawal-form-title" class="text-lg font-semibold text-white/90 sm:text-xl">
        <span class="mr-2 text-white/30">{{ sections.length + 1 }}.</span>Ejercer el arrepentimiento
      </h2>
      <p class="mt-4 leading-relaxed text-white/70">
        Completá el número de orden y el email de la compra. No guardamos nada acá: el pedido se envía por WhatsApp o por email, y te respondemos por el mismo canal.
      </p>
      <form class="mt-6 flex flex-col gap-4" novalidate @submit.prevent>
        <label class="flex flex-col gap-1.5 text-sm">
          <span class="text-white/70">Número de orden</span>
          <input v-model="orderId" name="orderId" type="text" autocomplete="off" placeholder="Lo encontrás en el email de confirmación" :class="inputClass" />
        </label>
        <label class="flex flex-col gap-1.5 text-sm">
          <span class="text-white/70">Email de la compra</span>
          <input v-model="email" name="email" type="email" autocomplete="email" placeholder="tu@email.com" :class="inputClass" />
        </label>
        <div class="mt-2 flex flex-col gap-3 sm:flex-row">
          <a
            :href="canSend ? whatsappHref : undefined"
            target="_blank"
            rel="noopener"
            data-testid="withdrawal-whatsapp"
            :aria-disabled="!canSend"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-white shadow-[0_0_24px_rgba(124,92,252,0.35)] transition hover:bg-accent-hover aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            Enviar por WhatsApp
          </a>
          <a
            :href="canSend ? mailHref : undefined"
            data-testid="withdrawal-email"
            :aria-disabled="!canSend"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            Enviar por email
          </a>
        </div>
      </form>
      <p class="mt-4 text-xs text-white/40">
        Respondemos por WhatsApp en minutos dentro del horario de atención ({{ SUPPORT_HOURS }}) y por email dentro de las 24 h hábiles.
      </p>
    </section>
  </LegalArticle>
</template>
