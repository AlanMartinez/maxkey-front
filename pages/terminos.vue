<script setup lang="ts">
import type { LegalSection } from '~/components/legal/LegalArticle.vue'

useHead({
  title: 'Términos y condiciones · CHEKEYS',
  meta: [{ name: 'description', content: 'Condiciones de uso y compra en CHEKEYS: cuentas, pagos, entrega de claves digitales, regiones y responsabilidades.' }],
})

const sections: LegalSection[] = [
  {
    id: 'aceptacion',
    title: 'Aceptación de los términos',
    paragraphs: [
      'Al acceder a CHEKEYS, crear una cuenta o realizar una compra, aceptás estos Términos y condiciones y nuestra Política de privacidad. Si no estás de acuerdo con alguna de estas condiciones, no utilices el sitio.',
      'Podemos actualizar estos términos para reflejar cambios en el servicio o en la normativa aplicable. La versión vigente es siempre la publicada en esta página, con su fecha de última actualización.',
    ],
  },
  {
    id: 'servicio',
    title: 'Descripción del servicio',
    paragraphs: [
      'CHEKEYS comercializa claves digitales de activación para videojuegos, tarjetas de regalo y suscripciones de plataformas de terceros. Cada clave se entrega en formato digital dentro de tu cuenta; no realizamos envíos físicos.',
      'Las plataformas donde se canjean las claves (Steam, PlayStation Network, Xbox, Riot Games, entre otras) son operadas por terceros con sus propios términos. CHEKEYS no está afiliado a esas plataformas ni controla su funcionamiento.',
    ],
  },
  {
    id: 'cuenta',
    title: 'Cuenta de usuario',
    paragraphs: [
      'Para comprar es necesario iniciar sesión con una cuenta de Google. Sos responsable de mantener la seguridad de esa cuenta y de toda actividad realizada desde ella.',
      'Nos reservamos el derecho de suspender cuentas ante indicios de fraude, uso de medios de pago no autorizados, abuso del sistema de reembolsos o cualquier otra actividad que infrinja estos términos.',
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
    title: 'Entrega de claves',
    paragraphs: [
      'Las claves se entregan de forma digital en la sección “Mis compras” una vez acreditado el pago. En circunstancias excepcionales (verificación antifraude, falta de stock momentánea) la entrega puede demorar; en ese caso te informaremos y podrás optar por esperar o solicitar el reintegro.',
      'La clave se considera entregada al quedar disponible en tu cuenta. A partir de ese momento sos responsable de resguardarla y de no compartirla con terceros.',
    ],
  },
  {
    id: 'regiones',
    title: 'Regiones y requisitos de activación',
    paragraphs: [
      'Muchas claves están restringidas a determinadas regiones o requieren cumplir requisitos de la plataforma (edad mínima, contenido base para un DLC, cuenta activa, etc.). Esta información se indica en la página de cada producto y es tu responsabilidad verificarla antes de comprar.',
      'No nos hacemos responsables por claves que no puedan canjearse debido a incompatibilidad de región o incumplimiento de requisitos de la plataforma cuando dicha información estaba publicada en el producto.',
    ],
  },
  {
    id: 'reembolsos',
    title: 'Reembolsos y reclamos',
    paragraphs: [
      'Dado que las claves son bienes digitales de un solo uso, los reembolsos se limitan a los casos previstos en nuestra Política de reembolsos: claves no entregadas o claves inválidas que no hayan sido reveladas ni canjeadas.',
      'Para iniciar un reclamo, contactanos a través de los canales publicados en la sección Contacto indicando el número de orden. Nos comprometemos a responder dentro de los plazos allí informados.',
    ],
  },
  {
    id: 'responsabilidad',
    title: 'Limitación de responsabilidad',
    paragraphs: [
      'CHEKEYS no es responsable por interrupciones, cambios o cierres de servicios de las plataformas de terceros, ni por daños indirectos derivados del uso o la imposibilidad de uso de una clave.',
      'Nuestra responsabilidad frente a cualquier reclamo relacionado con una compra se limita al importe efectivamente abonado por esa compra.',
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
    subtitle="Las reglas que rigen el uso de CHEKEYS y la compra de claves digitales."
    updated-at="19 de septiembre de 2026"
    :sections="sections"
  />
</template>
