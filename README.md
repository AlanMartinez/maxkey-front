# maxkeys-front

Nuxt 3 storefront for the Maxkeys digital game-key marketplace (Chekeys UI).

## Local development

1. Copy `.env.example` to `.env` and fill in the values (see [Environment variables](#environment-variables)).
2. Install dependencies: `npm ci`
3. Run the dev server: `npm run dev`
4. Run the test suite: `npm run test`
5. Run the type checker: `npm run typecheck`

## Environment variables

| Variable | Purpose |
|---|---|
| `NUXT_PUBLIC_API_BASE_URL` | Backend deploy URL, e.g. `https://maxkeys-api.fly.dev` (`http://localhost:8080` locally). Feeds `runtimeConfig.public.apiBaseUrl`. |
| `NUXT_PUBLIC_SITE_URL` | This site's own public URL. Used as the Supabase OAuth `redirectTo` target. |
| `SUPABASE_URL` | Supabase project URL, consumed by `@nuxtjs/supabase`. |
| `SUPABASE_KEY` | Supabase **anon/publishable key only** — never the service role key. |

## Deploy (Vercel)

1. Import this repository into Vercel. Root directory = repo root (no override); framework is auto-detected as **Nuxt.js**.
2. Set the four variables above under Project Settings → Environment Variables, for both **Production** and **Preview**.
3. `NUXT_PUBLIC_SITE_URL` must match the exact Vercel URL (or custom domain) serving that deployment, and that URL must be listed in Supabase Auth → URL Configuration → Redirect URLs, or the OAuth callback will fail.
4. `vercel.json` pins `framework: nuxtjs` and `installCommand: npm ci` for reproducible builds; no other Vercel configuration is required — the Nitro `vercel` preset is auto-detected at build time.

**Every Vercel Preview deployment gets its own origin.** Before a preview can call the API or complete login, add its origin to:
- the backend's `Cors:AllowedOrigins` (`maxkeys-back`, PR18a/config), and
- Supabase Auth → URL Configuration → Redirect URLs.

## API contract

This repository consumes the backend API from [`maxkey-back`](https://github.com/AlanMartinez/maxkey-back).
The contract source of truth lives in that repository:

- Specs: `openspec/changes/mvp-marketplace/specs/*/spec.md`
- API contract (endpoints, DTOs, Problem Details mapping): `openspec/changes/mvp-marketplace/design.md`, section 7

`types/api.ts` mirrors those DTOs by hand; every type cites the design section 7 row it mirrors.
