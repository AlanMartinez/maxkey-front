import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  // Components are referenced by file name (AppButton, ProductCard), not by directory prefix.
  components: [{ path: '~/components', pathPrefix: false }],
  // Most pages are public; auth-only pages opt in via middleware/auth.ts (design.md §9).
  // Supabase is used for auth only; no generated database types (`Database = unknown`).
  supabase: { redirect: false, types: false },
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
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'CHEKEYS',
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icon/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icon/favicon-16x16.png' },
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
