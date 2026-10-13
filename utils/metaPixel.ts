export const META_PIXEL_ID = '1147312244291163'

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[]; push: Fbq; loaded: boolean; version: string }

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

/** Meta standard events sent by the storefront (https://developers.facebook.com/docs/meta-pixel/reference). */
export type MetaPixelEvent = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'

/**
 * Sends a standard event when the pixel is loaded (client, non-dev builds); a no-op otherwise, so callers
 * never need to guard. `eventId` lets Meta deduplicate the same event if it is reported twice.
 */
export function trackPixel(event: MetaPixelEvent, params?: Record<string, unknown>, eventId?: string) {
  if (!import.meta.client || !window.fbq) return
  if (eventId) window.fbq('track', event, params ?? {}, { eventID: eventId })
  else window.fbq('track', event, params)
}

/** Product-level payload shared by ViewContent and AddToCart; product slugs are the catalog content ids. */
export function productPixelParams(productSlug: string, value: number, currency: string) {
  return { content_ids: [productSlug], content_type: 'product', value, currency }
}

const PURCHASE_STORAGE_PREFIX = 'chekeys.pixelPurchase.'

/** Reports a paid order once per browser: revisiting or reloading the result page must not count it again. */
export function trackPurchaseOnce(orderId: string, value: number, currency: string) {
  try {
    if (localStorage.getItem(PURCHASE_STORAGE_PREFIX + orderId)) return
    localStorage.setItem(PURCHASE_STORAGE_PREFIX + orderId, '1')
  } catch {
    // Storage blocked: still report it; the order id as eventID lets Meta drop duplicates.
  }
  trackPixel('Purchase', { value, currency }, orderId)
}
