// DTOs mirrored by hand from maxkeys-back design.md §7 (cross-repo contract, ADR-18). Changes are additive.

// mirrors design.md §7 "GET /catalog/products" response item (ProductSummary)
export interface ProductSummary {
  id: string
  slug: string
  name: string
  platform: string
  imageUrl: string
  fromPrice: number
  oldPrice?: number
}

// mirrors design.md §7 "GET /catalog/products/{slug}" response `variants[]`
export interface ProductVariantDto {
  id: string
  name: string
  region?: string
  edition?: string
  price: number
  oldPrice?: number
  currency: string
  /** Exactly one variant per product is flagged by the backend; drives the default selection and the "Más elegido" tag. */
  isRecommended: boolean
}

// mirrors design.md §7 "GET /catalog/products/{slug}" response (ProductDetail)
export interface ProductDetail extends ProductSummary {
  description: string
  variants: ProductVariantDto[]
  /** Wider product-view image (backend field `DetailImageUrl`); falls back to `imageUrl` when unset. */
  detailImageUrl?: string
  /** Resolved gallery URLs, gallery order, main image first (always an array). */
  images: string[]
  /** Markdown activation guide rendered on the product page; null when the product has none. */
  activationGuide: string | null
  /** Free-text activation type shown on the product page (e.g. "Enlace de activación"). */
  activationType: string | null
}

// mirrors design.md §7 "POST /checkout/orders" request `items[]`
export interface CreateOrderItem { variantId: string; quantity: number }

// mirrors design.md §7 "POST /checkout/orders" request
export interface CreateOrderRequest { email: string; items: CreateOrderItem[] }

// mirrors design.md §7 "POST /checkout/orders" 201 response
export interface CreateOrderResponse { orderId: string; initPoint: string }

// mirrors design.md §4.2 Order statuses as serialized by the API (enums as text, ADR-07).
// KeysAssigned added by key-delivery-gate (maxkeys-back PR #49): payment approval now auto-assigns keys
// when stock exists and stops there — an order no longer reaches Delivered on its own, an admin must
// confirm delivery via POST /admin/orders/{id}/deliver once all keys are assigned.
export type OrderStatus = 'Pending' | 'Paid' | 'AwaitingFulfillment' | 'KeysAssigned' | 'Delivered' | 'Cancelled'

// mirrors design.md §7 "GET /checkout/orders/{id}/status" response
export interface OrderStatusResponse {
  orderId: string
  status: OrderStatus
  lastPaymentAttemptStatus?: string
  buyerEmailMasked: string
  totalAmount: number
  currency: string
}

// mirrors design.md §7 "GET /me/orders" response item (OrderSummary)
export interface OrderSummaryDto {
  id: string
  status: OrderStatus
  totalAmount: number
  currency: string
  createdAt: string
  itemCount: number
}

// mirrors design.md §7 "GET /me/orders/{id}" response `items[]` (PR #49, key-delivery-gate). `keys` now
// holds only already-revealed codes and stays empty until revealed via the reveal endpoint below;
// `revealable` is the server's own signal for whether the reveal action should show for this item —
// never re-derive that from `order.status` client-side. `itemId` mirrors MyOrderItemDetail.ItemId and
// is the path segment for POST .../items/{itemId}/keys/reveal.
export interface OrderItemDto {
  itemId: string
  productName: string
  variantName: string
  unitPrice: number
  quantity: number
  keys: string[]
  revealable: boolean
}

// mirrors design.md §7 "GET /me/orders/{id}" response (OrderDetail). Key visibility is per-item now
// (see OrderItemDto), not gated by this order-level status.
export interface OrderDetailDto {
  id: string
  status: OrderStatus
  totalAmount: number
  currency: string
  createdAt: string
  items: OrderItemDto[]
}

// mirrors design.md §7 "Error mapping" — RFC 7807 Problem Details with `traceId` extension
export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
  traceId?: string
  errors?: Record<string, string[]>
}

// mirrors admin-dashboard design.md D5 "GET /admin/me" response
export interface AdminMeResponse { sub: string }

// mirrors admin-dashboard design.md D3 currency whitelist (backend rejects any other ISO4217 code)
export type AdminCurrency = 'ARS' | 'USD'

// mirrors admin-dashboard design.md D3 "GET /admin/catalog/products" response `variants[]` item
// (admin-catalog-crud contract) oldPrice is now backend-computed from price/discountPercentage — never send it back
export interface AdminVariant {
  id: string
  region?: string
  edition?: string
  price: number
  oldPrice?: number
  discountPercentage?: number
  currency: AdminCurrency
  sortOrder: number
  isActive: boolean
  /** At most one per product; the backend clears the siblings when a variant is marked. */
  isRecommended: boolean
}

// mirrors admin-dashboard design.md D3 "GET /admin/catalog/products" response item (includes inactive)
export interface AdminProduct {
  id: string
  slug: string
  name: string
  platform: string
  isActive: boolean
  imageKey?: string
  imageUrl: string
  /** R2 key for the wider product-detail image (backend field `DetailImageKey`). */
  detailImageKey?: string
  /** Built the same way as `imageUrl`; falls back to it when unset. */
  detailImageUrl?: string
  /** Markdown activation guide rendered on the product page; null when the product has none. */
  activationGuide: string | null
  /** Free-text activation type shown on the product page (e.g. "Enlace de activación"). */
  activationType: string | null
  /** Raw gallery image R2 keys beyond imageKey/detailImageKey, for re-editing (always an array). */
  imageKeys: string[]
  /** Resolved gallery URLs parallel to imageKeys (same pairing pattern as imageKey/imageUrl). */
  images: string[]
  description: string
  variants: AdminVariant[]
}

// mirrors admin-dashboard design.md D3 "PUT /admin/catalog/products/{id}" request body
export interface UpdateProductRequest {
  slug: string
  name: string
  platform: string
  description?: string
  imageKey?: string
  detailImageKey?: string
  activationGuide: string | null
  activationType: string | null
  imageKeys: string[]
  isActive: boolean
}

// mirrors admin-catalog-crud contract "POST /admin/catalog/products" request body
export interface CreateProductRequest {
  slug: string
  name: string
  platform: string
  description?: string
  imageKey?: string
  detailImageKey?: string
  activationGuide: string | null
  activationType: string | null
  imageKeys: string[]
  isActive: boolean
}

// mirrors admin-catalog-crud contract "PUT /admin/catalog/variants/{id}" request body
// discountPercentage replaces oldPrice as input (0 < pct < 100); oldPrice stays response-only, computed
export interface UpdateProductVariantRequest {
  price: number
  discountPercentage?: number
  currency: AdminCurrency
  region?: string
  edition?: string
  sortOrder: number
  isActive: boolean
  /** Required: an omitted value deserializes as `false` and silently un-marks the variant on every edit. */
  isRecommended: boolean
}

// mirrors admin-catalog-crud contract "POST /admin/catalog/products/{productId}/variants" request body
export interface CreateProductVariantRequest {
  region?: string
  edition?: string
  price: number
  discountPercentage?: number
  currency: AdminCurrency
  sortOrder: number
  isActive: boolean
}

// mirrors admin-dashboard design.md D2 "GET /catalog/carousel" response item (public; title/caption already resolved)
export interface CarouselSlideDto {
  id: string
  title: string
  caption?: string
  imageUrl: string
  productSlug: string
  sortOrder: number
}

// mirrors admin-dashboard design.md D2 "GET /admin/carousel" response item (raw overrides + product context)
export interface AdminCarouselSlideDto {
  id: string
  productId: string
  productName: string
  productSlug: string
  productIsActive: boolean
  sortOrder: number
  isActive: boolean
  title?: string
  caption?: string
  imageKey?: string
  imageUrl: string
}

// mirrors admin-dashboard design.md D2 "POST /admin/carousel" and "PUT /admin/carousel/{id}" request body
export interface CarouselSlideRequest {
  productId: string
  sortOrder: number
  isActive: boolean
  title?: string
  caption?: string
  imageKey?: string
}

// mirrors admin-dashboard design.md D4 "GET /admin/buyers" response `orders[].items[]` (admin-buyers spec: Key Exposure in Buyer View — count only, never a key code)
export interface AdminBuyerOrderItem {
  productName: string
  variantName: string
  quantity: number
  assignedKeys: number
  revealedKeys: number
}

// mirrors admin-dashboard design.md D4 "GET /admin/buyers" response `orders[]`
export interface AdminBuyerOrder {
  id: string
  status: OrderStatus
  paidAt?: string
  totalAmount: number
  currency: string
  items: AdminBuyerOrderItem[]
}

// mirrors admin-dashboard design.md D4 "GET /admin/buyers" response `items[]` (buyer grouped by email)
export interface AdminBuyer {
  email: string
  orderCount: number
  lastPaidAt?: string
  orders: AdminBuyerOrder[]
}

// mirrors admin-dashboard design.md D4 "GET /admin/buyers" response (pagination metadata alongside items)
export interface AdminBuyersPage {
  items: AdminBuyer[]
  page: number
  pageSize: number
  total: number
}

// mirrors admin-dashboard design.md D1 "POST /admin/orders/{id}/resend-delivery" 202 response
export interface ResendDeliveryResponse { outboxEventId: string }

// mirrors "GET /admin/orders/{id}" (maxkeys-back branch worktree-admin-order-detail) — admin order
// detail modal. useAdminOrderDetail.ts falls back to dev mock data until that branch is merged and
// deployed. Field names follow the Order / OrderItem / OutboxEvent domain entities 1:1.
// Key Exposure rule still applies: keys expose ids, status and timestamps, never a key code.
// Reveal tracking is the dispute evidence ("I never got it"): the backend sets revealedAt/revealedBy
// once on the first reveal (later reveals are no-ops), so status === 'Revealed' iff revealedAt != null.
export type AdminOrderKeyStatus = 'Assigned' | 'Revealed'

export interface AdminOrderKey {
  keyId: string
  status: AdminOrderKeyStatus
  assignedAt: string | null
  revealedAt: string | null
  /** Authenticated Supabase user id (as string) that revealed the key; null until revealed. */
  revealedBy: string | null
}

export interface AdminOrderDetailItem {
  itemId: string
  productName: string
  variantName: string
  unitPrice: number
  quantity: number
  keys: AdminOrderKey[]
}

// mirrors Maxkeys.Domain.Outbox.OutboxEventStatus
export type AdminOrderEventStatus = 'Pending' | 'Processing' | 'Processed' | 'Failed'

// One outbox event tied to the order (OrderApproved / OrderDelivered / OrderDeliveryResendRequested…),
// oldest first. The outbox is a dispatch queue, not an audit log — reveals are NOT events here.
export interface AdminOrderEvent {
  id: string
  type: string
  status: AdminOrderEventStatus
  createdAt: string
  processedAt: string | null
  attempts: number
  lastError: string | null
}

export interface AdminOrderDetail {
  id: string
  buyerEmail: string
  status: OrderStatus
  totalAmount: number
  currency: string
  createdAt: string
  paidAt: string | null
  deliveredAt: string | null
  updatedAt: string
  mpPaymentId: string | null
  lastPaymentAttemptStatus: string | null
  lastPaymentAttemptAt: string | null
  items: AdminOrderDetailItem[]
  events: AdminOrderEvent[]
}

// mirrors key-delivery-gate spec (maxkeys-back PR #49) "POST /admin/orders/{id}/assign-keys" response.
// items[].itemId does not correlate to anything on AdminBuyerOrderItem (that list DTO carries no id) —
// local per-item counts are patched by index instead (see useAdminBuyers applyAssignResult).
export interface AssignKeysResponse {
  orderStatus: OrderStatus
  allItemsComplete: boolean
  items: { itemId: string; quantity: number; assignedKeys: number }[]
}

// mirrors maxkeys-back "POST /admin/orders/{orderId}/items/{itemId}/keys" response: one plaintext key
// attached by hand from the order detail modal. Same shape as AssignKeysResponse minus
// allItemsComplete, and the per-item count is `assigned` (not `assignedKeys`) on this endpoint.
export interface AttachKeyResponse {
  orderStatus: OrderStatus
  items: { itemId: string; quantity: number; assigned: number }[]
}

// mirrors key-delivery-gate spec (maxkeys-back PR #49) "POST /admin/orders/{id}/deliver" response.
// 409 (status isn't KeysAssigned yet) is an expected outcome, not surfaced as an unexpected failure.
export interface DeliverOrderResponse { status: OrderStatus }

// mirrors key-delivery-gate spec (maxkeys-back PR #49) "POST /me/orders/{id}/items/{itemId}/keys/reveal"
// response. Idempotent server-side — safe to call again on an already-revealed item.
export interface RevealKeysResponse { codes: string[] }

// mirrors vault spec "GET /admin/vault/products" response `variants[]` item (maxkeys-back PR #48, fixed contract)
export interface AdminVaultVariant {
  id: string
  region: string | null
  edition: string | null
  availableCount: number
  assignedCount: number
}

// mirrors vault spec "GET /admin/vault/products" response item. vaultEnabled is product-wide —
// there is no per-variant toggle, matching PUT /admin/vault/products/{id}/toggle applying to all variants.
export interface AdminVaultProduct {
  id: string
  name: string
  vaultEnabled: boolean
  variants: AdminVaultVariant[]
}

// mirrors vault spec "POST /admin/vault/variants/{id}/keys" request body
export interface UploadVaultKeysRequest {
  codes: string[]
}

// mirrors vault spec "POST /admin/vault/variants/{id}/keys" 200 response.
// availableCount is the variant's updated total, not a delta — always reflect it, never increment locally.
export interface UploadVaultKeysResponse {
  addedCount: number
  availableCount: number
}

// mirrors vault spec "PUT /admin/vault/products/{id}/toggle" request body
export interface ToggleVaultProductRequest {
  enabled: boolean
}

// mirrors vault spec "PUT /admin/vault/products/{id}/toggle" response
export interface ToggleVaultProductResponse {
  vaultEnabled: boolean
}

// mirrors vault spec "GET /admin/vault/variants/{id}/keys" response item (PR #48, commit 82d37ec)
export type VaultKeyStatus = 'Available' | 'Assigned'

export interface AdminVaultKey {
  keyId: string
  status: VaultKeyStatus
  loadedBy: string
  createdAt: string
  assignedAt: string | null
  orderItemId: string | null
}
