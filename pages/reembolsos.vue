<script setup lang="ts">
import type { LegalSection } from '~/components/legal/LegalArticle.vue'
import { WITHDRAWAL_DAYS } from '~/utils/business'
import { DELIVERY_MAX_HOURS, REFUND_CLAIM_DAYS } from '~/utils/promises'

useSeo({
  title: 'Política de reembolsos',
  description: 'Cuándo corresponde un reembolso en CHEKEYS, qué pasa al revelar una clave digital («key»), qué casos quedan excluidos y cómo iniciar un reclamo.',
  path: '/reembolsos',
})

const sections: LegalSection[] = [
  {
    id: 'principio',
    title: 'Principio general',
    paragraphs: [
      'Las claves digitales («keys») son bienes de un solo uso: una vez reveladas o canjeadas no pueden volver a venderse. Por eso, los reembolsos se limitan a los casos en que CHEKEYS no pudo cumplir con la entrega o la key entregada no funciona.',
      'CHEKEYS es el proveedor de las keys que vende: no dependemos de un tercero para verificar el estado de una key, lo hacemos directamente.',
      'Esta política no limita los derechos que te reconoce la legislación de defensa del consumidor de la República Argentina.',
    ],
  },
  {
    id: 'corresponde',
    title: 'Casos en que corresponde reembolso',
    paragraphs: ['Reintegramos el importe total de la orden cuando:'],
    bullets: [
      `El pago fue acreditado pero la key no fue entregada dentro de las ${DELIVERY_MAX_HOURS} horas y preferís no esperar.`,
      'La key entregada resulta inválida, ya utilizada o no reconocida por la plataforma, y CHEKEYS lo confirma al verificar directamente el estado de la key.',
      'La orden fue cancelada por CHEKEYS por falta de disponibilidad o error en la publicación.',
    ],
  },
  {
    id: 'reveladas',
    title: 'Keys reveladas',
    paragraphs: [
      'Revelar una key en “Mis compras” (o abrirla desde el email de entrega) equivale a recibir el producto. A partir de ese momento no hay reembolso por arrepentimiento, por compra equivocada (juego, edición o plataforma incorrectos) ni por incompatibilidad de región.',
      'La única excepción es que la plataforma rechace la key como inválida o ya utilizada y CHEKEYS lo confirme. En ese caso te ofrecemos una key de reemplazo o el reintegro total, a tu elección.',
      'Antes de revelar, verificá que la plataforma y la región del producto sean las correctas para tu cuenta. El sitio te lo recuerda con una confirmación previa.',
    ],
  },
  {
    id: 'excluidos',
    title: 'Casos excluidos',
    paragraphs: ['No corresponde reembolso cuando:'],
    bullets: [
      'La key fue revelada y canjeada correctamente en la plataforma.',
      'La key ya fue revelada y no puede activarse por incompatibilidad de región o por no cumplir requisitos de la plataforma que estaban indicados en la página del producto.',
      'Comprás un producto por error (juego equivocado, edición equivocada, plataforma equivocada) y la key ya fue revelada.',
      'La plataforma de destino suspende o cierra tu cuenta por causas ajenas a CHEKEYS.',
    ],
  },
  {
    id: 'reclamo',
    title: 'Cómo iniciar un reclamo',
    paragraphs: [`Contactanos por email o WhatsApp dentro de los ${REFUND_CLAIM_DAYS} días posteriores a la entrega, incluyendo:`],
    bullets: [
      'El número de orden (disponible en el email de confirmación y, si iniciaste sesión, en “Mis compras”).',
      'Una descripción del problema y, si corresponde, una captura del error que muestra la plataforma.',
      'La región de la cuenta donde intentaste canjear la key.',
    ],
    links: [{ label: 'Ir a contacto', to: '/contacto' }],
  },
  {
    id: 'verificacion',
    title: 'Verificación',
    paragraphs: [
      'CHEKEYS es el proveedor de las keys: ante un reclamo por key inválida verificamos directamente el estado de la key. Este proceso suele completarse dentro de las 48 horas hábiles. Si la key resulta defectuosa, te ofrecemos una key de reemplazo o el reintegro, a tu elección.',
      'Si la verificación indica que la key fue canjeada, te informaremos la fecha y la plataforma del canje. En ese caso el reclamo se considera resuelto sin reembolso.',
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
    title: 'Cancelaciones y arrepentimiento antes de revelar',
    paragraphs: [
      'Si el pago todavía no se acreditó, podés simplemente no completarlo: la orden se cancela automáticamente. Si el pago ya se acreditó pero la key aún no fue entregada, podés solicitar la cancelación y el reintegro total.',
      `Si la key ya fue entregada pero todavía no la revelaste ni la canjeaste, podés ejercer el derecho de arrepentimiento dentro de los ${WITHDRAWAL_DAYS} días corridos desde la compra a través del Botón de arrepentimiento.`,
    ],
    links: [{ label: 'Botón de arrepentimiento', to: '/arrepentimiento' }],
  },
]
</script>

<template>
  <LegalArticle
    title="Política de reembolsos"
    subtitle="Reglas claras para que sepas qué esperar si algo no sale como debía."
    updated-at="23 de septiembre de 2026"
    :sections="sections"
  />
</template>
