import type { MaybeRefOrGetter } from 'vue'
import { SITE_NAME } from '~/utils/business'

export const DEFAULT_OG_IMAGE = '/images/logo/logo.png'

export interface SeoParams {
  title: string
  description: string
  /** Route path ("/ayuda") or absolute URL; resolved against `runtimeConfig.public.siteUrl` for canonical/og:url. */
  path: string
  /** Path or absolute URL of the share image; defaults to the brand logo. */
  image?: string
  /** og:type — 'website' unless the page describes a product or an article. */
  type?: 'website' | 'product' | 'article'
}

/** "Ayuda" → "Ayuda · CHEKEYS"; titles that already name the brand are kept verbatim. */
export function seoTitle(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`
}

/** Joins a path to the site origin; absolute URLs pass through untouched. */
export function absoluteUrl(siteUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${siteUrl.replace(/\/+$/, '')}/${pathOrUrl.replace(/^\/+/, '')}`
}

/**
 * Page-level SEO in one call: <title> with the brand suffix, description, canonical link and the
 * Open Graph / Twitter card set, all with absolute URLs. Accepts a getter so data-driven pages
 * (product, article) stay reactive.
 */
export function useSeo(input: MaybeRefOrGetter<SeoParams>) {
  const siteUrl = useRuntimeConfig().public.siteUrl as string
  const params = () => toValue(input)
  const title = () => seoTitle(params().title)
  const description = () => params().description
  const url = () => absoluteUrl(siteUrl, params().path)
  const image = () => absoluteUrl(siteUrl, params().image ?? DEFAULT_OG_IMAGE)
  const type = () => params().type ?? 'website'

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogSiteName: SITE_NAME,
    ogImage: image,
    twitterCard: 'summary_large_image',
  })
  // og:type 'product' is outside unhead's typed union, so it goes through the raw meta list.
  useHead({
    meta: [{ property: 'og:type', content: type }],
    link: [{ rel: 'canonical', href: url }],
  })

  return { title, url, image }
}
