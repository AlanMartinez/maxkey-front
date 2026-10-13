export const CART_STORAGE_KEY = 'chekeys.cart.v1'
export const MIN_QUANTITY = 1
export const MAX_QUANTITY = 10
/** Mirrors the backend `Order.Create` cap of 20 distinct lines (cart-checkout spec). */
export const MAX_LINES = 20
/** Carts idle for longer than this are emptied: lines saved yesterday may no longer be on sale. */
export const CART_TTL_MS = 60 * 60 * 1000

export interface CartLine {
  variantId: string
  productSlug: string
  productName: string
  variantName: string
  unitPrice: number
  currency: string
  imageUrl?: string
  quantity: number
}

export interface CartState { lines: CartLine[] }

interface StoredCart extends CartState { updatedAt: number }

export interface CartLinePrice {
  variantId: string
  unitPrice: number
  currency: string
}

/** Catalog snapshot of one product: its on-sale variants, or `null` when the product is no longer listed (404). */
export interface CatalogAvailability {
  productSlug: string
  variants: CartLinePrice[] | null
}

export type AddResult = { ok: true } | { ok: false; reason: 'max-items' }

export function clampQuantity(quantity: number) {
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(quantity) || MIN_QUANTITY))
}

/**
 * Reads the persisted cart; corrupt or foreign payloads, carts idle past `CART_TTL_MS` and carts saved
 * without a timestamp (before the TTL existed) all yield `null` instead of throwing.
 */
function readStorage(now = Date.now()): StoredCart | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null') as Partial<StoredCart> | null
    if (typeof parsed?.updatedAt !== 'number' || now - parsed.updatedAt >= CART_TTL_MS) return null
    const lines = Array.isArray(parsed.lines) ? parsed.lines : []
    return {
      lines: lines.filter((l) => typeof l?.variantId === 'string').map((l) => ({ ...l, quantity: clampQuantity(l.quantity) })),
      updatedAt: parsed.updatedAt,
    }
  } catch {
    return null
  }
}

/**
 * Client cart shared across the app (design §9). Prices are indicative; the server recomputes at checkout.
 * Hydrates from localStorage on the client only (after mount inside components) to avoid SSR mismatches.
 */
export function useCart() {
  const state = useState<CartState>('cart', () => ({ lines: [] }))
  const hydrated = useState('cart-hydrated', () => false)
  const isOpen = useState('cart-open', () => false)

  function hydrate() {
    if (hydrated.value || !import.meta.client) return
    hydrated.value = true
    const stored = readStorage()
    state.value = { lines: stored?.lines ?? [] }
    if (!stored) localStorage.removeItem(CART_STORAGE_KEY)
    // Detached scope: the watcher and the expiry timer must outlive whichever component happened to hydrate first.
    effectScope(true).run(() => {
      let expiry: ReturnType<typeof setTimeout> | undefined
      // The TTL slides with every change; an open tab empties itself once the cart has been idle for the full window.
      const scheduleExpiry = (cart: CartState | undefined, updatedAt: number) => {
        clearTimeout(expiry)
        if (cart?.lines.length) expiry = setTimeout(() => { state.value = { lines: [] } }, updatedAt + CART_TTL_MS - Date.now())
      }
      if (stored) scheduleExpiry(stored, stored.updatedAt)
      watch(state, (value) => {
        const updatedAt = Date.now()
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ ...value, updatedAt } satisfies StoredCart))
        scheduleExpiry(value, updatedAt)
      }, { deep: true })
    })
  }
  if (getCurrentInstance()) onMounted(hydrate)
  else hydrate()

  const lines = computed(() => state.value.lines)
  const count = computed(() => state.value.lines.reduce((sum, l) => sum + l.quantity, 0))
  const subtotal = computed(() => state.value.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0))
  const isEmpty = computed(() => state.value.lines.length === 0)

  function add(line: Omit<CartLine, 'quantity'>, quantity = 1): AddResult {
    const existing = state.value.lines.find((l) => l.variantId === line.variantId)
    if (existing) {
      existing.quantity = clampQuantity(existing.quantity + quantity)
      return { ok: true }
    }
    if (state.value.lines.length >= MAX_LINES) return { ok: false, reason: 'max-items' }
    state.value.lines.push({ ...line, quantity: clampQuantity(quantity) })
    return { ok: true }
  }

  function remove(variantId: string) {
    state.value.lines = state.value.lines.filter((l) => l.variantId !== variantId)
  }

  function setQuantity(variantId: string, quantity: number) {
    const line = state.value.lines.find((l) => l.variantId === variantId)
    if (line) line.quantity = clampQuantity(quantity)
  }

  /**
   * Reconciles the cart with fresh catalog data: lines whose product or variant is no longer on sale are
   * dropped and the rest get current prices. Products missing from `products` (e.g. a failed request) are
   * left untouched. Returns how many lines were removed.
   */
  function syncCatalog(products: CatalogAvailability[]) {
    const bySlug = new Map(products.map((product) => [product.productSlug, product.variants]))
    const kept = state.value.lines.filter((line) => {
      if (!bySlug.has(line.productSlug)) return true
      const price = bySlug.get(line.productSlug)?.find((variant) => variant.variantId === line.variantId)
      if (!price) return false
      line.unitPrice = price.unitPrice
      line.currency = price.currency
      return true
    })
    const removed = state.value.lines.length - kept.length
    if (removed) state.value.lines = kept
    return removed
  }

  function clear() {
    state.value.lines = []
  }

  const open = () => { isOpen.value = true }
  const close = () => { isOpen.value = false }
  const toggle = () => { isOpen.value = !isOpen.value }

  return { lines, count, subtotal, isEmpty, add, remove, setQuantity, syncCatalog, clear, isOpen, open, close, toggle }
}
