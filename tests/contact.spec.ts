import { describe, expect, it } from 'vitest'
import { SUPPORT_EMAIL, WHATSAPP_NUMBER, whatsappUrl } from '~/utils/contact'

describe('whatsappUrl', () => {
  it('links to the support number without a prefilled text when no message is given', () => {
    expect(whatsappUrl()).toBe(`https://wa.me/${WHATSAPP_NUMBER}`)
  })

  it('URL-encodes the prefilled message', () => {
    expect(whatsappUrl('Hola, necesito ayuda con mi compra en CHEKEYS')).toBe(
      `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%2C%20necesito%20ayuda%20con%20mi%20compra%20en%20CHEKEYS`,
    )
  })

  it('exposes a support email shaped like an address', () => {
    expect(SUPPORT_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
  })
})
