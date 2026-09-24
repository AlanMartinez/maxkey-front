import { SUPPORT_HOURS } from '~/utils/contact'

// Single source of truth for every buyer-facing promise (delivery, verification, payment, refund,
// support). Trust badges, FAQ, checkout copy and legal pages read from here so the site never
// contradicts itself (e.g. "instantánea" on the home vs "24 h" in the refund policy).

/** Upper bound we commit to for key delivery after payment is confirmed. */
export const DELIVERY_MAX_HOURS = 24
/** Days after delivery during which a buyer can open a refund claim. */
export const REFUND_CLAIM_DAYS = 7

export interface TrustPromise {
  /** Badge label (3-5 words). */
  short: string
  /** One-sentence honest detail, shown as tooltip/sub-line and in FAQ/legal copy. */
  detail: string
  /** Page that backs the promise; the badge renders as a link when set. */
  href?: string
}

export const DELIVERY: TrustPromise = {
  short: 'Entrega rápida',
  detail: `Generalmente en minutos, máximo ${DELIVERY_MAX_HOURS} h. Te avisamos por email y, si iniciaste sesión, la ves en Mis compras.`,
}

export const VERIFIED_KEYS: TrustPromise = {
  short: 'Keys verificadas',
  detail: 'Somos el proveedor: cada key se controla antes de venderse.',
  href: '/reembolsos',
}

export const SECURE_PAYMENT: TrustPromise = {
  short: 'Pago seguro con Mercado Pago',
  detail: 'CHEKEYS no ve ni guarda los datos de tu tarjeta.',
}

export const REFUND: TrustPromise = {
  short: 'Garantía de reembolso',
  detail: 'Si la key no llega o no funciona, te devolvemos el dinero. Ver condiciones.',
  href: '/reembolsos',
}

export const SUPPORT: TrustPromise = {
  short: 'Soporte humano por WhatsApp',
  detail: SUPPORT_HOURS,
  href: '/contacto',
}

/** Delivery promise as a single sentence for inline copy ("recibí tu key ..."). */
export const DELIVERY_INLINE = `por email en minutos (máximo ${DELIVERY_MAX_HOURS} h)`
