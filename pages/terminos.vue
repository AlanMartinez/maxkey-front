<script setup lang="ts">
import type { LegalSection } from '~/components/legal/LegalArticle.vue'
import { WITHDRAWAL_DAYS, businessIdentity } from '~/utils/business'
import { DELIVERY_MAX_HOURS } from '~/utils/promises'

useSeo({
  title: 'Términos y condiciones',
  description: 'Condiciones de uso y compra en CHEKEYS: pagos, entrega de claves digitales («keys») por email, regiones, reembolsos y responsabilidades.',
  path: '/terminos',
})

const sections: LegalSection[] = [
  {
    id: 'responsable',
    title: 'Responsable',
    paragraphs: [
      `El sitio es operado por ${businessIdentity()}. Para consultas legales o reclamos, escribinos por los canales publicados en la sección Contacto.`,
    ],
  },
  {
    id: 'aceptacion',
    title: 'Aceptación de los términos',
    paragraphs: [
      'Al acceder a CHEKEYS o realizar una compra, aceptás estos Términos y condiciones y nuestra Política de privacidad. Si no estás de acuerdo con alguna de estas condiciones, no utilices el sitio.',
      'Podemos actualizar estos términos para reflejar cambios en el servicio o en la normativa aplicable. La versión vigente es siempre la publicada en esta página, con su fecha de última actualización.',
    ],
  },
  {
    id: 'servicio',
    title: 'Descripción del servicio',
    paragraphs: [
      'CHEKEYS comercializa claves digitales («keys») de activación para videojuegos, gift cards y suscripciones de plataformas de terceros. CHEKEYS es el proveedor directo de las keys que vende. Cada key se entrega en formato digital por email; no realizamos envíos físicos.',
      'Las plataformas donde se canjean las keys (Steam, PlayStation Network, Xbox, Riot Games, entre otras) son operadas por terceros con sus propios términos. CHEKEYS no está afiliado a esas plataformas ni controla su funcionamiento.',
    ],
  },
  {
    id: 'cuenta',
    title: 'Compra con o sin cuenta',
    paragraphs: [
      'No hace falta una cuenta para comprar: con tu email alcanza, y a esa dirección te llega la key. Sos responsable de indicar un email correcto y de tener acceso a él.',
      'Si iniciás sesión con Google, las órdenes asociadas a ese email quedan además visibles en “Mis compras”. Sos responsable de mantener la seguridad de esa cuenta y de toda actividad realizada desde ella.',
      'Nos reservamos el derecho de rechazar órdenes o suspender cuentas ante indicios de fraude, uso de medios de pago no autorizados, abuso del sistema de reembolsos o cualquier otra actividad que infrinja estos términos.',
    ],
  },
  {
    id: 'precios-pagos',
    title: 'Precios y pagos',
    paragraphs: [
      'Los precios se expresan en pesos argentinos (ARS) e incluyen los impuestos aplicables. Podemos modificar precios y promociones en cualquier momento; el precio aplicable a una compra es el vigente al momento de confirmarla.',
      'Los pagos se procesan a través de Mercado Pago. CHEKEYS no recibe ni almacena datos de tarjetas. La orden se considera pagada cuando Mercado Pago confirma la acreditación.',
    ],
    bullets: [
      'Una orden sin pago acreditado no genera obligación de entrega y puede cancelarse automáticamente.',
      'En caso de error evidente en un precio publicado, podemos cancelar la orden y reintegrar el importe abonado.',
    ],
  },
  {
    id: 'entrega',
    title: 'Entrega de keys',
    paragraphs: [
      `Las keys se entregan de forma digital por email una vez acreditado el pago, generalmente en minutos y como máximo dentro de las ${DELIVERY_MAX_HOURS} horas. Si iniciaste sesión, también quedan disponibles en “Mis compras”. En circunstancias excepcionales (verificación antifraude, falta de disponibilidad momentánea) la entrega puede demorar; en ese caso te informaremos y podrás optar por esperar o solicitar el reintegro.`,
      'La key se considera entregada al ser enviada al email indicado en la compra o al quedar disponible en “Mis compras”, lo que ocurra primero. A partir de ese momento sos responsable de resguardarla y de no compartirla con terceros.',
    ],
  },
  {
    id: 'regiones',
    title: 'Regiones y requisitos de activación',
    paragraphs: [
      'Muchas keys están restringidas a determinadas regiones o requieren cumplir requisitos de la plataforma (edad mínima, contenido base para un DLC, cuenta activa, etc.). Esta información se indica en la página de cada producto y es tu responsabilidad verificarla antes de comprar.',
      'No nos hacemos responsables por keys que no puedan canjearse debido a incompatibilidad de región o incumplimiento de requisitos de la plataforma cuando dicha información estaba publicada en el producto.',
    ],
  },
  {
    id: 'reembolsos',
    title: 'Reembolsos, arrepentimiento y reclamos',
    paragraphs: [
      'Dado que las keys son bienes digitales de un solo uso, los reembolsos se limitan a los casos previstos en nuestra Política de reembolsos: keys no entregadas o keys inválidas. Revelar una key equivale a recibir el producto; desde ese momento solo corresponde reemplazo o reintegro si la plataforma la rechaza como inválida o ya usada y CHEKEYS lo confirma.',
      `Podés ejercer el derecho de arrepentimiento (Ley 24.240, art. 34) dentro de los ${WITHDRAWAL_DAYS} días corridos desde la compra, siempre que la key no haya sido revelada ni canjeada, a través del Botón de arrepentimiento.`,
      'Para iniciar un reclamo, contactanos a través de los canales publicados en la sección Contacto indicando el número de orden. Nos comprometemos a responder dentro de los plazos allí informados.',
    ],
    links: [
      { label: 'Política de reembolsos', to: '/reembolsos' },
      { label: 'Botón de arrepentimiento', to: '/arrepentimiento' },
    ],
  },
  {
    id: 'responsabilidad',
    title: 'Limitación de responsabilidad',
    paragraphs: [
      'CHEKEYS no es responsable por interrupciones, cambios o cierres de servicios de las plataformas de terceros, ni por daños indirectos derivados del uso o la imposibilidad de uso de una key.',
      'Nuestra responsabilidad frente a cualquier reclamo relacionado con una compra se limita al importe efectivamente abonado por esa compra, sin perjuicio de los derechos que te asisten como consumidor.',
    ],
  },
  {
    id: 'ley',
    title: 'Ley aplicable',
    paragraphs: [
      'Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia será resuelta ante los tribunales ordinarios competentes, sin perjuicio de los derechos que te asisten como consumidor.',
    ],
  },
]
</script>

<template>
  <LegalArticle
    title="Términos y condiciones"
    subtitle="Las reglas que rigen el uso de CHEKEYS y la compra de claves digitales («keys»)."
    updated-at="23 de septiembre de 2026"
    :sections="sections"
  />
</template>
