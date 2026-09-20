// Support channels shown in the footer and on /contacto. Placeholders until the real accounts exist:
// swap the values here and every link in the site follows.
export const SUPPORT_EMAIL = 'soporte@chekeys.com'
/** International format without `+` or spaces, as `wa.me` expects (e.g. 54 9 11 XXXX XXXX). */
export const WHATSAPP_NUMBER = '5491100000000'
export const SUPPORT_HOURS = 'Lunes a sábados, 10 a 22 h (ART)'

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
