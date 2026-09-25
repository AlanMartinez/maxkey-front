// Closed set of values for the product `activationType` field, shown as "Tipo" in the admin editor
// and the product detail page. The field itself stays free-text on the wire (legacy products may
// hold other strings), but new edits are restricted to these three.
export const PRODUCT_TYPES = ['Código Digital', 'Regalo', 'Cuenta'] as const
