import type { ProductSummary } from '~/types/api'

// Public, indexable pages. Product URLs are appended from the live catalog.
const STATIC_PATHS = ['/', '/como-funciona', '/ayuda', '/contacto', '/terminos', '/privacidad', '/reembolsos', '/arrepentimiento']

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event).public
  const siteUrl = (config.siteUrl as string).replace(/\/+$/, '')

  // A catalog outage must not break the sitemap: fall back to the static pages only.
  const products = await $fetch<ProductSummary[]>('/catalog/products', { baseURL: config.apiBaseUrl as string }).catch(() => [])

  const urls = [
    ...STATIC_PATHS.map((path) => ({ loc: `${siteUrl}${path}`, priority: path === '/' ? '1.0' : '0.5' })),
    ...products.map((product) => ({ loc: `${siteUrl}/product/${encodeURIComponent(product.slug)}`, priority: '0.8' })),
  ]

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escapeXml(url.loc)}</loc><priority>${url.priority}</priority></url>`),
    '</urlset>',
    '',
  ].join('\n')
})
