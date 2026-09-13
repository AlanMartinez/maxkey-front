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
