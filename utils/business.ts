// Legal identity shown in the footer and legal pages. Leave a field empty and its line is hidden.
export const BUSINESS = {
  legalName: 'MOBISUR',
  cuit: '20-35885558-0',
  address: 'Alberdi 979, Río Grande, Tierra del Fuego',
  dataFiscalUrl: '',
}
export const CONSUMER_DEFENSE_URL = 'https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario'
export const WITHDRAWAL_DAYS = 10

// No alias imports here on purpose: nuxt.config.ts imports this file relatively for the default <head>.
export const SITE_NAME = 'CHEKEYS'
export const SITE_DESCRIPTION = 'Keys para juegos, gift cards y suscripciones, con entrega rápida y pago seguro con Mercado Pago.'

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
