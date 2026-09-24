<script setup lang="ts">
import type { LegalSection } from '~/components/legal/LegalArticle.vue'
import { businessIdentity } from '~/utils/business'

useSeo({
  title: 'Política de privacidad',
  description: 'Qué datos recopila CHEKEYS, para qué los usa, con quién los comparte y cómo podés ejercer tus derechos.',
  path: '/privacidad',
})

const sections: LegalSection[] = [
  {
    id: 'responsable',
    title: 'Responsable del tratamiento',
    paragraphs: [
      `${businessIdentity()} es el responsable del tratamiento de los datos personales descriptos en esta política. Podés contactarnos por los canales publicados en la sección Contacto.`,
    ],
  },
  {
    id: 'alcance',
    title: 'Alcance',
    paragraphs: [
      'Esta política describe cómo CHEKEYS trata los datos personales de quienes navegan el sitio, inician sesión o realizan compras. Tratamos tus datos conforme a la Ley 25.326 de Protección de Datos Personales de la República Argentina.',
    ],
  },
  {
    id: 'datos',
    title: 'Qué datos recopilamos',
    paragraphs: ['Recopilamos únicamente lo necesario para operar la tienda y cumplir con nuestras obligaciones legales:'],
    bullets: [
      'El email que indicás al comprar, necesario para entregarte la key y la confirmación de la orden.',
      'Si iniciás sesión con Google: nombre, dirección de email e identificador de la cuenta. No accedemos a tu contraseña ni a otros datos de Google.',
      'Datos de tus compras: productos, importes, fechas, estado del pago y claves digitales («keys») entregadas.',
      'Datos técnicos mínimos: dirección IP, tipo de navegador y registros de acceso, utilizados con fines de seguridad y prevención de fraude.',
    ],
  },
  {
    id: 'uso',
    title: 'Para qué usamos tus datos',
    paragraphs: ['Utilizamos tus datos con las siguientes finalidades:'],
    bullets: [
      'Procesar tus órdenes y entregarte las keys adquiridas.',
      'Enviarte comunicaciones relacionadas con tus compras (confirmaciones, avisos de entrega, respuestas de soporte).',
      'Prevenir fraudes y proteger la seguridad del sitio y de tu cuenta.',
      'Cumplir con obligaciones fiscales y legales.',
    ],
  },
  {
    id: 'pagos',
    title: 'Pagos y terceros',
    paragraphs: [
      'Los pagos se procesan a través de Mercado Pago. Los datos de tu medio de pago se ingresan directamente en su plataforma y quedan sujetos a su propia política de privacidad; CHEKEYS no recibe ni almacena números de tarjeta.',
      'La autenticación opcional se realiza mediante Google. Compartimos con estos proveedores solo la información imprescindible para que el servicio funcione. No vendemos ni cedemos tus datos a terceros con fines comerciales.',
    ],
  },
  {
    id: 'almacenamiento',
    title: 'Cookies y almacenamiento local',
    paragraphs: [
      'Utilizamos cookies y el almacenamiento local de tu navegador exclusivamente para funciones esenciales: mantener tu sesión iniciada, recordar el contenido de tu carrito y volver a la pantalla correcta después de iniciar sesión.',
      'No utilizamos cookies publicitarias ni de seguimiento entre sitios. Podés borrar estos datos desde la configuración de tu navegador; al hacerlo se cerrará tu sesión y se vaciará el carrito.',
    ],
  },
  {
    id: 'retencion',
    title: 'Conservación de los datos',
    paragraphs: [
      'Conservamos los datos de tu cuenta mientras la mantengas activa. Los registros de compras se conservan durante el plazo exigido por la normativa fiscal y contable, aun si eliminás tu cuenta.',
      'Los registros técnicos de acceso se eliminan periódicamente una vez cumplida su finalidad de seguridad.',
    ],
  },
  {
    id: 'seguridad',
    title: 'Seguridad',
    paragraphs: [
      'Aplicamos medidas técnicas y organizativas razonables para proteger tus datos: cifrado en tránsito, cifrado de las keys almacenadas y acceso restringido al personal autorizado.',
      'Ningún sistema es infalible. Si detectamos un incidente que afecte tus datos, te lo comunicaremos conforme a la normativa aplicable.',
    ],
  },
  {
    id: 'derechos',
    title: 'Tus derechos',
    paragraphs: [
      'Podés acceder, rectificar, actualizar o solicitar la supresión de tus datos personales escribiéndonos por los canales publicados en la sección Contacto. Responderemos dentro de los plazos legales.',
      'La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.',
    ],
  },
]
</script>

<template>
  <LegalArticle
    title="Política de privacidad"
    subtitle="Qué datos tratamos, con qué fin y cómo los protegemos."
    updated-at="23 de septiembre de 2026"
    :sections="sections"
  />
</template>
