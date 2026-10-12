// Legal identity shown in the footer and legal pages. Leave a field empty and its line is hidden.
export const BUSINESS = {
  legalName: 'MOBISUR',
  cuit: '20-35885558-0',
  address: 'Alberdi 979, Río Grande, Tierra del Fuego',
  dataFiscalUrl: '',
  // Footer identity row is hidden for now; legal pages still show the data via businessIdentity().
  showInFooter: false,
}
export const CONSUMER_DEFENSE_URL = 'https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario'
export const WITHDRAWAL_DAYS = 10

// No alias imports here on purpose: nuxt.config.ts imports this file relatively for the default <head>.
export const SITE_NAME = 'Chekeys'
export const SITE_DESCRIPTION = 'Venta de keys de juegos, Robux, gift cards y suscripciones en LATAM. Entrega rápida por email y pago seguro con Mercado Pago.'

/**
 * One-line legal identity for the "Responsable" paragraphs: "Razón Social, CUIT 30-…, con domicilio en …".
 * Falls back to the brand name alone while the real data is not configured, so no page ever renders
 * a dangling "CUIT " label.
 */
export function businessIdentity(): string {
  if (!BUSINESS.legalName) return SITE_NAME
  const parts = [BUSINESS.legalName]
  if (BUSINESS.cuit) parts.push(`CUIT ${BUSINESS.cuit}`)
  if (BUSINESS.address) parts.push(`con domicilio en ${BUSINESS.address}`)
  return parts.join(', ')
}
