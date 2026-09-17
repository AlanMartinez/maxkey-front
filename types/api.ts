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
}

// mirrors design.md §7 "GET /catalog/products/{slug}" response (ProductDetail)
export interface ProductDetail extends ProductSummary {
  description: string
  variants: ProductVariantDto[]
  /** Wider product-view image (backend field `DetailImageUrl`); falls back to `imageUrl` when unset. */
  detailImageUrl?: string
  /** Resolved gallery URLs, gallery order, main image first (always an array). */
  images: string[]
  /** Link to the activation guide, shown on the product page. */
  activationGuideUrl: string | null
  /** Free-text activation type shown on the product page (e.g. "Enlace de activación"). */
  activationType: string | null
}

// mirrors design.md §7 "POST /checkout/orders" request `items[]`
export interface CreateOrderItem { variantId: string; quantity: number }

// mirrors design.md §7 "POST /checkout/orders" request
export interface CreateOrderRequest { email: string; items: CreateOrderItem[] }

// mirrors design.md §7 "POST /checkout/orders" 201 response
export interface CreateOrderResponse { orderId: string; initPoint: string }

// mirrors design.md §4.2 Order statuses as serialized by the API (enums as text, ADR-07)
export type OrderStatus = 'Pending' | 'Paid' | 'AwaitingFulfillment' | 'Delivered' | 'Cancelled'

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

// mirrors design.md §7 "GET /me/orders/{id}" response `items[]` — `keys` present only when `Delivered`
export interface OrderItemDto {
  productName: string
  variantName: string
  unitPrice: number
  quantity: number
  keys?: string[]
}

// mirrors design.md §7 "GET /me/orders/{id}" response (OrderDetail)
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
  /** Link to the activation guide, shown on the product page. */
  activationGuideUrl: string | null
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
  name: string
  platform: string
  description?: string
  imageKey?: string
  detailImageKey?: string
  activationGuideUrl: string | null
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
  activationGuideUrl: string | null
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
