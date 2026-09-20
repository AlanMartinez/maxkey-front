<script setup lang="ts">
import type { LegalSection } from '~/components/legal/LegalArticle.vue'

useHead({
  title: 'Política de reembolsos · CHEKEYS',
  meta: [{ name: 'description', content: 'Cuándo corresponde un reembolso en CHEKEYS, qué casos quedan excluidos y cómo iniciar un reclamo.' }],
})

const sections: LegalSection[] = [
  {
    id: 'principio',
    title: 'Principio general',
    paragraphs: [
      'Las claves digitales son bienes de un solo uso: una vez reveladas o canjeadas no pueden volver a venderse. Por eso, los reembolsos se limitan a los casos en que CHEKEYS no pudo cumplir con la entrega o la clave entregada no funciona.',
      'Esta política no limita los derechos que te reconoce la legislación de defensa del consumidor de la República Argentina.',
    ],
  },
  {
    id: 'corresponde',
    title: 'Casos en que corresponde reembolso',
    paragraphs: ['Reintegramos el importe total de la orden cuando:'],
    bullets: [
      'El pago fue acreditado pero la clave no fue entregada dentro de las 24 horas y preferís no esperar.',
      'La clave entregada resulta inválida, ya utilizada o no reconocida por la plataforma, y así lo verificamos con nuestro proveedor.',
      'La orden fue cancelada por CHEKEYS por falta de stock o error en la publicación.',
    ],
  },
  {
    id: 'excluidos',
    title: 'Casos excluidos',
    paragraphs: ['No corresponde reembolso cuando:'],
    bullets: [
      'La clave fue revelada y canjeada correctamente en la plataforma.',
      'La clave no puede activarse por incompatibilidad de región o por no cumplir requisitos de la plataforma que estaban indicados en la página del producto.',
      'Comprás un producto por error (juego equivocado, edición equivocada, plataforma equivocada) y la clave ya fue revelada.',
      'La plataforma de destino suspende o cierra tu cuenta por causas ajenas a CHEKEYS.',
    ],
  },
  {
    id: 'reclamo',
    title: 'Cómo iniciar un reclamo',
    paragraphs: ['Contactanos por email o WhatsApp dentro de los 7 días posteriores a la entrega, incluyendo:'],
    bullets: [
      'El número de orden (disponible en “Mis compras” y en el email de confirmación).',
      'Una descripción del problema y, si corresponde, una captura del error que muestra la plataforma.',
      'La región de la cuenta donde intentaste canjear la clave.',
    ],
  },
  {
    id: 'verificacion',
    title: 'Verificación',
    paragraphs: [
      'Ante un reclamo por clave inválida verificamos su estado con nuestro proveedor. Este proceso suele completarse dentro de las 48 horas hábiles. Si la clave resulta defectuosa, te ofrecemos una clave de reemplazo o el reintegro, a tu elección.',
      'Si la verificación indica que la clave fue canjeada, te informaremos la fecha y la plataforma del canje. En ese caso el reclamo se considera resuelto sin reembolso.',
    ],
  },
  {
    id: 'plazos',
    title: 'Plazos y medio de reintegro',
    paragraphs: [
      'Los reintegros se realizan a través de Mercado Pago, al mismo medio de pago utilizado en la compra. Una vez aprobado, el tiempo de acreditación depende de tu banco o emisor y suele ser de 5 a 15 días hábiles.',
      'Te notificaremos por email cuando el reintegro haya sido emitido.',
    ],
  },
  {
    id: 'cancelaciones',
    title: 'Cancelaciones antes de la entrega',
    paragraphs: [
      'Si el pago todavía no se acreditó, podés simplemente no completarlo: la orden se cancela automáticamente. Si el pago ya se acreditó pero la clave aún no fue entregada, podés solicitar la cancelación y el reintegro total.',
    ],
  },
]
</script>

<template>
  <LegalArticle
    title="Política de reembolsos"
    subtitle="Reglas claras para que sepas qué esperar si algo no sale como debía."
    updated-at="19 de septiembre de 2026"
    :sections="sections"
  />
</template>
