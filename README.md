# maxkeys-front

Nuxt 3 storefront for the Maxkeys digital game-key marketplace (Nexo UI).

## API contract

This repository consumes the backend API from [`maxkey-back`](https://github.com/AlanMartinez/maxkey-back).
The contract source of truth lives in that repository:

- Specs: `openspec/changes/mvp-marketplace/specs/*/spec.md`
- API contract (endpoints, DTOs, Problem Details mapping): `openspec/changes/mvp-marketplace/design.md`, section 7

`types/api.ts` mirrors those DTOs by hand; every type cites the design section 7 row it mirrors.

## Environment

See `.env.example`. `NUXT_PUBLIC_API_BASE_URL` points at the backend deployment.
