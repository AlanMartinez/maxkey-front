# Activation Guides — Design

Date: 2026-09-23
Repos affected: `maxkeys-front` (this repo) and `maxkeys` (backend, `C:\Personal\Projects\maxkeys`)

## Problem

Today each product carries its own free-text Markdown activation guide
(`Product.ActivationGuide`), edited inline in `ProductEditor.vue` and rendered
as a collapsible section on the product page. Products that share a platform
(e.g. every Microsoft gift card) duplicate the same guide text, and there is
no reuse: editing one product's guide never updates another's.

## Goal

Turn the activation guide into a standalone, admin-authored page reachable at
`/article/{slug}`. Products reference one guide by selection (a dropdown, not
free text); multiple products may point at the same guide. `activationType`
(the short free-text label, e.g. "Enlace de activación") is unrelated and
stays as-is.

## Scope

- New `ActivationGuide` entity, own bounded context (`Guides`), not nested
  under `Catalog` — it is a small, purpose-built resource (a guide page), not
  a general CMS/article system.
- Admin CRUD for guides (list, create, edit, delete) reusing the existing
  `MarkdownEditor` component and the existing ImageKit upload flow for images
  referenced inside guide Markdown.
- `Product` gains a nullable reference to one guide, replacing the free-text
  `activationGuide` column. `activationType` is untouched.
- One seed guide is created as an editable example; no bulk migration of
  existing free-text guides — remaining guides are recreated by hand in the
  admin.
- Public route `/article/[slug].vue` renders a guide standalone. The product
  page links to it instead of rendering the guide inline.

## Out of scope

- Draft/published workflow — everything created is live.
- Automatic guide assignment by platform/category — selection is manual per
  product.
- A general-purpose article/CMS system for unrelated content (blog, help
  pages) — this is scoped to activation guides only.

## Backend (`maxkeys`)

Mirrors the existing `Catalog` resource's layering (chosen because it's the
most recently added, most complete example in this codebase).

- **Domain**: `src/Maxkeys.Domain/Guides/ActivationGuide.cs` — `Id`, `Title`,
  `Slug`, `ContentMarkdown`, timestamps.
- **Infrastructure**: `GuideConfiguration.cs` (EF mapping) in
  `src/Maxkeys.Infrastructure/Persistence/Configurations/`. New migration
  (`yyyyMMddHHmmss_AddActivationGuideAndProductReference`) adds the `Guides`
  table and replaces `Product.ActivationGuide` (text column) with a nullable
  `ActivationGuideId` FK.
- **Application**: `src/Maxkeys.Application/Guides/{CreateGuide,UpdateGuide,DeleteGuide}.cs`,
  one class per use case, matching the `Catalog` use-case style.
- **Admin API**: new `AdminGuidesEndpoints.cs`, group `/admin/guides` under
  `AdminPolicy` — `POST`, `PUT /{id}`, `GET` (list), `DELETE /{id}`. Delete is
  a **hard delete**, but returns `409 Conflict` if any product still
  references the guide (no silent orphaning of a product's FK — guides are
  shared, unlike a single product's own variant).
- **Public API**: `GET /guides/{slug}` — used by the front's `/article/[slug]`
  page. Internal resource name stays "guide"; the public front-end path is
  "article" by product choice — no naming coupling required.
- **`AdminCatalogEndpoints`**: `CreateProductRequest`/`UpdateProductRequest`
  and their DTOs change `activationGuide: string` → `activationGuideId: Guid?`.
  `activationType` fields are unchanged.
- **Tests (xUnit)**: `GuideTests.cs` (domain), `CreateGuideTests.cs` /
  `DeleteGuideTests.cs` (including the 409-on-referenced case) under
  `Maxkeys.Application.Tests/Guides/`, `AdminGuidesEndpointsTests.cs` under
  `Maxkeys.Api.Tests/Admin/`. Existing `ProductTests.cs` and
  `AdminCatalogEndpointsTests.cs` updated for the FK field change.
- **Seed**: one example `ActivationGuide` row added under `seed/`.
- **Contract doc**: `openspec/changes/mvp-marketplace/design.md` §7 gets the
  new `ActivationGuide` DTOs and endpoints documented, plus the updated
  `Product` DTO shape.
- No new parallel `openspec/changes/...` folder is created for this feature;
  it's tracked by this spec + the implementation plan instead, to avoid
  duplicating process across two repos' conventions.

## Frontend (`maxkeys-front`)

- **`types/api.ts`**: new `ActivationGuideDto` (`id`, `slug`, `title`,
  `content`). `ProductDetail`/`AdminProduct` etc: `activationGuide: string | null`
  → `activationGuideSlug: string | null` (public detail response) /
  `activationGuideId: string | null` (admin request/response, matching the
  backend FK).
- **`composables/useAdminGuides.ts`**: new, same skeleton as
  `useAdminCatalog.ts` — `list`/`create`/`update`/`delete` against
  `/admin/guides`.
- **Admin UI**: new `pages/admin/guides.vue` + a `GuideForm.vue` component
  (list + form, same pattern as `carousel.vue` + `SlideForm.vue`) using
  `MarkdownEditor` for content and the existing ImageKit upload flow for
  in-content images.
- **`ProductEditor.vue`**: removes the `activationGuide` textarea/`MarkdownEditor`
  block (current lines ~245-247) and the `hasActivationGuide` checkbox;
  replaced by a `<select>` bound to `activationGuideId`, options populated
  from `useAdminGuides()`. `activationType` input is untouched.
- **`pages/product/[slug].vue`**: removes the inline `CollapsibleSection`
  guide rendering (current lines 194-201) and `activationGuideHtml`/
  `activationGuideOpen` logic; the existing "Consultar guía de activación"
  action (line 49) now navigates to `/article/{activationGuideSlug}` instead
  of toggling the inline section.
- **`pages/article/[slug].vue`**: new public page — fetch guide by slug,
  render with the existing `renderMarkdown` util, `markdown-body` styling
  (same classes used elsewhere), simple layout similar to `pages/ayuda.vue`.
  404/redirect if slug not found.

## Data flow

Admin creates a guide (`POST /admin/guides`) → selects it on one or more
products (`PUT /admin/catalog/products/{id}` with `activationGuideId`) →
storefront links to `/article/{slug}` from any product carrying that guide →
`/article/[slug].vue` fetches `GET /guides/{slug}` and renders it.

## Error handling

- Deleting a guide still referenced by a product → backend `409`, admin UI
  shows a toast (existing `ApiError`/`useToast` pattern) naming the conflict;
  no client-side pre-check needed, the 409 message is enough.
- `/article/{slug}` with unknown slug → standard "not found" handling
  consistent with `/product/[slug].vue`'s existing pattern for a missing
  product.

## Testing

- Backend: xUnit unit tests per layer as listed above (domain entity,
  application use cases including the 409 path, endpoint tests).
- Frontend: component/composable specs following existing conventions
  (`tests/useAdminCatalog.spec.ts`, `tests/ProductEditor.spec.ts` as
  precedent) — `useAdminGuides.spec.ts`, updated `ProductEditor.spec.ts` for
  the select-instead-of-textarea change, new spec for `/article/[slug].vue`.
- Manual: create the seed guide's admin edit, assign it to a product, verify
  the storefront link navigates to the rendered article page.
