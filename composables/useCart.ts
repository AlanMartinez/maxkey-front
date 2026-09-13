export const CART_STORAGE_KEY = 'nexo.cart.v1'
export const MIN_QUANTITY = 1
export const MAX_QUANTITY = 10
/** Mirrors the backend `Order.Create` cap of 20 distinct lines (cart-checkout spec). */
export const MAX_LINES = 20

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

export type AddResult = { ok: true } | { ok: false; reason: 'max-items' }

export function clampQuantity(quantity: number) {
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(quantity) || MIN_QUANTITY))
}

/** Reads the persisted cart; corrupt or foreign payloads yield an empty cart instead of throwing. */
function readStorage(): CartState {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null') as Partial<CartState> | null
    const lines = Array.isArray(parsed?.lines) ? parsed.lines : []
    return { lines: lines.filter((l) => typeof l?.variantId === 'string').map((l) => ({ ...l, quantity: clampQuantity(l.quantity) })) }
  } catch {
    return { lines: [] }
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
    state.value = readStorage()
    // Detached scope: the watcher must outlive whichever component happened to hydrate first.
    effectScope(true).run(() => watch(state, (value) => localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(value)), { deep: true }))
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

  function clear() {
    state.value.lines = []
  }

  const open = () => { isOpen.value = true }
  const close = () => { isOpen.value = false }
  const toggle = () => { isOpen.value = !isOpen.value }

  return { lines, count, subtotal, isEmpty, add, remove, setQuantity, clear, isOpen, open, close, toggle }
}
