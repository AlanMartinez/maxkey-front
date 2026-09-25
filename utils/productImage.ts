import { buildSrc } from '@imagekit/javascript'
import type { ProductSummary } from '~/types/api'

/** Local placeholder shown when a product has no `imageUrl` yet (admin-dashboard design.md D6). */
export const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg'

const IMAGEKIT_HOST = 'ik.imagekit.io'

/**
 * Requests an ImageKit-resized version so the browser never has to downscale the full-resolution
 * original (source photos run ~1800x2400+, but thumbnails render at ~200-400px) — that heavy a
 * downscale is what Chromium renders as pixelated at 100% zoom. Non-ImageKit URLs (placeholder,
 * legacy hosts) pass through untouched.
 */
export function resizedImageUrl(url: string, width: number): string {
  if (!url.includes(IMAGEKIT_HOST)) return url
  return buildSrc({ src: url, urlEndpoint: '', transformation: [{ width, quality: 80, format: 'auto' }] })
}

export function productImageUrl(product: Pick<ProductSummary, 'imageUrl'>, width = 424): string {
  return resizedImageUrl(product.imageUrl || PLACEHOLDER_IMAGE, width)
}
