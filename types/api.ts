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
  /** Gallery URLs (main image first). Not served by the API yet — needs a `Product.Images` list backend-side; the UI falls back to `imageUrl`. */
  images?: string[]
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

// mirrors admin-dashboard design.md D3 "GET /admin/catalog/products" response `variants[]` item
export interface AdminVariant {
  id: string
  region?: string
  edition?: string
  price: number
  oldPrice?: number
  currency: string
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
  description: string
  variants: AdminVariant[]
}

// mirrors admin-dashboard design.md D3 "PUT /admin/catalog/products/{id}" request body
export interface UpdateProductRequest {
  name: string
  platform: string
  description?: string
  imageKey?: string
  isActive: boolean
}

// mirrors admin-dashboard design.md D3 "PUT /admin/catalog/variants/{id}" request body
export interface UpdateProductVariantRequest {
  price: number
  oldPrice?: number
  currency: string
  region?: string
  edition?: string
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
