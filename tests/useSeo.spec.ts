import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { absoluteUrl, seoTitle, useSeo } from '~/composables/useSeo'

describe('seoTitle', () => {
  it('appends the brand suffix to page titles', () => {
    expect(seoTitle('Preguntas frecuentes')).toBe('Preguntas frecuentes · CHEKEYS')
  })

  it('keeps titles that already name the brand verbatim', () => {
    expect(seoTitle('CHEKEYS')).toBe('CHEKEYS')
    expect(seoTitle('CHEKEYS · Keys, gift cards y suscripciones')).toBe('CHEKEYS · Keys, gift cards y suscripciones')
  })
})

describe('absoluteUrl', () => {
  it('joins paths to the site origin regardless of slashes', () => {
    expect(absoluteUrl('https://chekeys.com', '/ayuda')).toBe('https://chekeys.com/ayuda')
    expect(absoluteUrl('https://chekeys.com/', 'ayuda')).toBe('https://chekeys.com/ayuda')
    expect(absoluteUrl('https://chekeys.com', '/')).toBe('https://chekeys.com/')
  })

  it('passes absolute URLs through untouched', () => {
    expect(absoluteUrl('https://chekeys.com', 'https://cdn.example/img.png')).toBe('https://cdn.example/img.png')
  })
})

describe('useSeo', () => {
  it('writes the suffixed title, absolute canonical link and Open Graph tags into the document head', async () => {
    const Probe = defineComponent({
      setup() {
        useSeo({ title: 'Preguntas frecuentes', description: 'Respuestas sobre pagos y entrega.', path: '/ayuda' })
        return () => h('div')
      },
    })

    await mountSuspended(Probe)
    // Unhead flushes DOM writes asynchronously.
    await new Promise((resolve) => setTimeout(resolve, 20))
    await nextTick()

    const meta = (selector: string) => document.head.querySelector(selector)?.getAttribute('content')
    expect(document.title).toBe('Preguntas frecuentes · CHEKEYS')
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('http://localhost:3000/ayuda')
    expect(meta('meta[name="description"]')).toBe('Respuestas sobre pagos y entrega.')
    expect(meta('meta[property="og:url"]')).toBe('http://localhost:3000/ayuda')
    expect(meta('meta[property="og:image"]')).toBe('http://localhost:3000/images/logo/logo.png')
    expect(meta('meta[property="og:type"]')).toBe('website')
    expect(meta('meta[property="og:site_name"]')).toBe('CHEKEYS')
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image')
  })
})
