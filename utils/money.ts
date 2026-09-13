/** Formats an amount for the es-AR audience (e.g. `$ 9.990`). Prices are indicative; the server recomputes. */
export function formatMoney(amount: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}
