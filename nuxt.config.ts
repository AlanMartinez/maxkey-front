export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  // Most pages are public; auth-only pages opt in via middleware/auth.ts (design.md §9).
  supabase: { redirect: false },
  runtimeConfig: {
    public: {
      // Overridden by NUXT_PUBLIC_API_BASE_URL / NUXT_PUBLIC_SITE_URL (design.md §10).
      apiBaseUrl: 'http://localhost:8080',
      siteUrl: 'http://localhost:3000',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'Nexo',
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap' },
      ],
    },
  },
})
