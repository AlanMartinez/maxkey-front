import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineNuxtConfig } from 'nuxt/config'
import { SITE_DESCRIPTION, SITE_NAME } from './utils/business'

// Same value as the `bg` token in tailwind.config.ts and public/icon/site.webmanifest, so the browser
// chrome (address bar, PWA splash) matches the app background.
const THEME_COLOR = '#0A0A0E'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  // Components are referenced by file name (AppButton, ProductCard), not by directory prefix.
  components: [{ path: '~/components', pathPrefix: false }],
  // Most pages are public; auth-only pages opt in via middleware/auth.ts (design.md §9).
  // Supabase is used for auth only; no generated database types (`Database = unknown`).
  supabase: { redirect: false, types: false },
  // No custom `nitro.errorHandler`: Nuxt's own handler renders error.vue (branded 404 / 500) and sets
  // the real status code. A custom handler here would replace it, not extend it.
  runtimeConfig: {
    public: {
      // Overridden by NUXT_PUBLIC_API_BASE_URL / NUXT_PUBLIC_SITE_URL (design.md §10).
      apiBaseUrl: 'http://localhost:8080',
      siteUrl: 'http://localhost:3000',
      // DEV-ONLY fallback bearer for /admin/* calls when there's no real Supabase session locally.
      // Mint one with `dotnet run --project src/Maxkeys.Api -- --print-dev-admin-token` (backend,
      // Development env only) and set NUXT_PUBLIC_DEV_ADMIN_TOKEN in .env.local. Ignored outside dev
      // (see useApi.ts) and never read in a production build.
      devAdminToken: '',
    },
  },
  // Private and transactional pages stay out of search results even if a link to them leaks.
  routeRules: {
    '/admin/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/account/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/checkout/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/auth/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: SITE_NAME,
      meta: [
        { name: 'description', content: SITE_DESCRIPTION },
        { name: 'theme-color', content: THEME_COLOR },
        { property: 'og:site_name', content: SITE_NAME },
      ],
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icon/favicon-32x32.png?v=2' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icon/favicon-16x16.png?v=2' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icon/apple-touch-icon.png' },
        { rel: 'manifest', href: '/icon/site.webmanifest' },
      ],
    },
  },
  hooks: {
    // Nuxt aliases `#app-manifest` to `.nuxt/manifest/meta/<buildId>.json` but only pre-creates
    // that file for production builds (`@nuxt/nitro-server`, `build:before`). In dev the file is
    // first written by Nitro's `rollup:before`, roughly 2 s after Vite already serves the client.
    // When `.nuxt/` was just cleared (nuxt build, nuxi prepare, npm install) and a browser tab
    // loads in that window, Vite fails with `Failed to resolve import "#app-manifest"`.
    // Mirror the production stub for dev; Nitro overwrites it with the real manifest.
    ready: async (nuxt) => {
      if (!nuxt.options.dev) return
      // Same expression `@nuxt/nitro-server` uses to build the alias path.
      const buildId = nuxt.options.runtimeConfig.app.buildId || nuxt.options.buildId
      const metaDir = join(nuxt.options.buildDir, 'manifest', 'meta')
      await mkdir(metaDir, { recursive: true })
      await writeFile(
        join(metaDir, `${buildId}.json`),
        JSON.stringify({ id: buildId, timestamp: Date.now(), prerendered: [] }),
        { flag: 'wx' },
      ).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'EEXIST') throw error
      })
    },
  },
})
