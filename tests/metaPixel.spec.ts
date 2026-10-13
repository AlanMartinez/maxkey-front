import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { productPixelParams, trackPixel, trackPurchaseOnce } from '~/utils/metaPixel'

let fbq: ReturnType<typeof vi.fn>

beforeEach(() => {
  localStorage.clear()
  fbq = vi.fn()
  window.fbq = fbq as unknown as Window['fbq']
})
afterEach(() => {
  delete window.fbq
})

describe('metaPixel', () => {
  it('sends standard events with an optional eventID', () => {
    trackPixel('AddToCart', productPixelParams('riot-points', 9990, 'ARS'))
    trackPixel('Purchase', { value: 1 }, 'order-1')

    expect(fbq).toHaveBeenNthCalledWith(1, 'track', 'AddToCart', { content_ids: ['riot-points'], content_type: 'product', value: 9990, currency: 'ARS' })
    expect(fbq).toHaveBeenNthCalledWith(2, 'track', 'Purchase', { value: 1 }, { eventID: 'order-1' })
  })

  it('is a no-op when the pixel is not loaded', () => {
    delete window.fbq
    expect(() => trackPixel('PageView')).not.toThrow()
  })

  it('reports each purchase only once per browser', () => {
    trackPurchaseOnce('order-1', 12500, 'ARS')
    trackPurchaseOnce('order-1', 12500, 'ARS')
    trackPurchaseOnce('order-2', 5000, 'ARS')

    expect(fbq).toHaveBeenCalledTimes(2)
    expect(fbq).toHaveBeenCalledWith('track', 'Purchase', { value: 12500, currency: 'ARS' }, { eventID: 'order-1' })
  })
})
