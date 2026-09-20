import type { AdminBuyer, AdminBuyersPage, AssignKeysResponse, DeliverOrderResponse, OrderStatus, ResendDeliveryResponse } from '~/types/api'
import { ApiError, isBackendUnreachable } from '~/composables/useApi'

/**
 * Admin buyers listing (search + pagination) and per-order delivery-email resend
 * (admin-buyers spec: Buyer Listing Grouped By Email, Resend Delivery Email; design D4).
 * Resend state is tracked per `orderId` so multiple orders on the page can resend independently
 * without one order's pending/error state leaking into another's.
 */

// DEV-ONLY fixture, same technique as mockVaultProducts in useAdminVault.ts: import.meta.dev is
// compile-time-false in production, so this whole branch is dead-code-eliminated in prod builds.
// 10 buyers, each isolating one scenario the key-delivery-gate UI needs to render correctly.
const mockDay = 86_400_000
const mockNow = Date.now()
const mockBuyers: AdminBuyer[] = [
  {
    // Unpaid order — no assign/deliver actions should be eligible.
    email: 'comprador1@example.com',
    orderCount: 1,
    orders: [
      {
        id: 'mock-order-01', status: 'Pending', totalAmount: 8000, currency: 'ARS',
        items: [{ productName: 'Steam Wallet Gift Card', variantName: 'AR', quantity: 1, assignedKeys: 0, revealedKeys: 0 }],
      },
    ],
  },
  {
    // Paid, not yet in fulfillment.
    email: 'comprador2@example.com',
    orderCount: 1,
    lastPaidAt: new Date(mockNow - 1 * mockDay).toISOString(),
    orders: [
      {
        id: 'mock-order-02', status: 'Paid', paidAt: new Date(mockNow - 1 * mockDay).toISOString(), totalAmount: 12000, currency: 'ARS',
        items: [{ productName: 'Minecraft Java Edition', variantName: 'Global', quantity: 1, assignedKeys: 0, revealedKeys: 0 }],
      },
    ],
  },
  {
    // Fresh AwaitingFulfillment, nothing assigned yet — the "needs Asignar" case.
    email: 'comprador3@example.com',
    orderCount: 1,
    lastPaidAt: new Date(mockNow - 2 * mockDay).toISOString(),
    orders: [
      {
        id: 'mock-order-03', status: 'AwaitingFulfillment', paidAt: new Date(mockNow - 2 * mockDay).toISOString(), totalAmount: 18000, currency: 'ARS',
        items: [{ productName: 'Windows 11 Pro', variantName: 'Global · Retail', quantity: 1, assignedKeys: 0, revealedKeys: 0 }],
      },
    ],
  },
  {
    // AwaitingFulfillment with a previous no-stock partial assign — exercises assignIncomplete on retry.
    email: 'comprador4@example.com',
    orderCount: 1,
    lastPaidAt: new Date(mockNow - 3 * mockDay).toISOString(),
    orders: [
      {
        id: 'mock-order-04', status: 'AwaitingFulfillment', paidAt: new Date(mockNow - 3 * mockDay).toISOString(), totalAmount: 27000, currency: 'ARS',
        items: [{ productName: 'Adobe Creative Cloud', variantName: 'Global · Suscripción', quantity: 3, assignedKeys: 1, revealedKeys: 0 }],
      },
    ],
  },
  {
    // KeysAssigned, fully assigned, nothing revealed — the "ready for Entregar" case.
    email: 'comprador5@example.com',
    orderCount: 1,
    lastPaidAt: new Date(mockNow - 4 * mockDay).toISOString(),
    orders: [
      {
        id: 'mock-order-05', status: 'KeysAssigned', paidAt: new Date(mockNow - 4 * mockDay).toISOString(), totalAmount: 9000, currency: 'ARS',
        items: [{ productName: 'Office 2021 Pro Plus', variantName: 'Global', quantity: 1, assignedKeys: 1, revealedKeys: 0 }],
      },
    ],
  },
  {
    // Delivered, fully assigned and fully revealed — closed-out order.
    email: 'comprador6@example.com',
    orderCount: 1,
    lastPaidAt: new Date(mockNow - 10 * mockDay).toISOString(),
    orders: [
      {
        id: 'mock-order-06', status: 'Delivered', paidAt: new Date(mockNow - 10 * mockDay).toISOString(), totalAmount: 8000, currency: 'ARS',
        items: [{ productName: 'Steam Wallet Gift Card', variantName: 'AR', quantity: 1, assignedKeys: 1, revealedKeys: 1 }],
      },
    ],
  },
  {
    // Delivered but the buyer hasn't revealed every item yet.
    email: 'comprador7@example.com',
    orderCount: 1,
    lastPaidAt: new Date(mockNow - 6 * mockDay).toISOString(),
    orders: [
      {
        id: 'mock-order-07', status: 'Delivered', paidAt: new Date(mockNow - 6 * mockDay).toISOString(), totalAmount: 36000, currency: 'ARS',
        items: [{ productName: 'Grand Theft Auto V', variantName: 'US · Retail', quantity: 2, assignedKeys: 2, revealedKeys: 1 }],
      },
    ],
  },
  {
    // Cancelled — no Asignar/Entregar/Reenviar action should render for this row.
    email: 'comprador8@example.com',
    orderCount: 1,
    lastPaidAt: new Date(mockNow - 8 * mockDay).toISOString(),
    orders: [
      {
        id: 'mock-order-08', status: 'Cancelled', paidAt: new Date(mockNow - 8 * mockDay).toISOString(), totalAmount: 14000, currency: 'ARS',
        items: [{ productName: 'FIFA 24 Ultimate Edition', variantName: 'Global', quantity: 1, assignedKeys: 0, revealedKeys: 0 }],
      },
    ],
  },
  {
    // Same buyer, 3 orders spanning different statuses — exercises repeated-email table rows.
    email: 'comprador9@example.com',
    orderCount: 3,
    lastPaidAt: new Date(mockNow - 1 * mockDay).toISOString(),
    orders: [
      {
        id: 'mock-order-09a', status: 'Paid', paidAt: new Date(mockNow - 9 * mockDay).toISOString(), totalAmount: 5000, currency: 'ARS',
        items: [{ productName: 'Red Dead Redemption 2', variantName: 'Global · Retail', quantity: 1, assignedKeys: 0, revealedKeys: 0 }],
      },
      {
        id: 'mock-order-09b', status: 'KeysAssigned', paidAt: new Date(mockNow - 5 * mockDay).toISOString(), totalAmount: 12000, currency: 'ARS',
        items: [{ productName: 'Windows 11 Pro', variantName: 'EU · OEM', quantity: 1, assignedKeys: 1, revealedKeys: 0 }],
      },
      {
        id: 'mock-order-09c', status: 'Delivered', paidAt: new Date(mockNow - 1 * mockDay).toISOString(), totalAmount: 8000, currency: 'ARS',
        items: [{ productName: 'Steam Wallet Gift Card', variantName: 'AR', quantity: 1, assignedKeys: 1, revealedKeys: 1 }],
      },
    ],
  },
  {
    // Single order, multiple line items with different per-item assigned/revealed counts —
    // exercises the compact multi-item "Items" column summary.
    email: 'comprador10@example.com',
    orderCount: 1,
    lastPaidAt: new Date(mockNow - 7 * mockDay).toISOString(),
    orders: [
      {
        id: 'mock-order-10', status: 'Delivered', paidAt: new Date(mockNow - 7 * mockDay).toISOString(), totalAmount: 45000, currency: 'ARS',
        items: [
          { productName: 'Xbox Game Pass Ultimate', variantName: 'Global · Digital', quantity: 1, assignedKeys: 1, revealedKeys: 1 },
          { productName: 'Minecraft Java Edition', variantName: 'Global', quantity: 2, assignedKeys: 2, revealedKeys: 0 },
          { productName: 'Office 2021 Pro Plus', variantName: 'Global', quantity: 1, assignedKeys: 1, revealedKeys: 1 },
        ],
      },
    ],
  },
]

function mockBuyersPage(): AdminBuyersPage {
  return { items: mockBuyers, page: 1, pageSize: mockBuyers.length, total: mockBuyers.length }
}

export function useAdminBuyers() {
  const api = useApi()
  // Action outcomes (assign/deliver/resend failures, partial stock) surface as floating toasts rather
  // than inline text in the table — see useToast.ts. The per-order refs below stay as state for callers.
  const toast = useToast()

  const email = ref('')
  const page = ref(1)
  const pageSize = ref(20)

  const buyers = ref<AdminBuyer[]>([])
  const total = ref(0)
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const error = ref<ApiError | null>(null)

  function toApiError(e: unknown) {
    return e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
  }

  async function load() {
    status.value = 'pending'
    error.value = null
    try {
      let result: AdminBuyersPage
      try {
        result = await api<AdminBuyersPage>('/admin/buyers', {
          query: { email: email.value || undefined, page: page.value, pageSize: pageSize.value },
        })
      } catch (e) {
        if (!import.meta.dev || !isBackendUnreachable(e)) throw e
        console.warn('[useAdminBuyers] /admin/buyers unavailable, using dev mock data:', e)
        result = mockBuyersPage()
      }
      buyers.value = result.items
      total.value = result.total
      status.value = 'success'
    } catch (e) {
      error.value = toApiError(e)
      status.value = 'error'
    }
  }

  function search(term: string) {
    email.value = term
    page.value = 1
    return load()
  }

  function goToPage(nextPage: number) {
    page.value = nextPage
    return load()
  }

  const resending = ref<Record<string, boolean>>({})
  const resendError = ref<Record<string, ApiError | null>>({})
  const resendSuccess = ref<Record<string, boolean>>({})

  async function resendDelivery(orderId: string) {
    resending.value[orderId] = true
    resendError.value[orderId] = null
    resendSuccess.value[orderId] = false
    try {
      try {
        await api<ResendDeliveryResponse>(`/admin/orders/${orderId}/resend-delivery`, { method: 'POST' })
      } catch (e) {
        if (!import.meta.dev || !isBackendUnreachable(e)) throw e
        console.warn('[useAdminBuyers] resend-delivery backend unavailable, treating as dev mock success:', e)
      }
      resendSuccess.value[orderId] = true
      return true
    } catch (e) {
      const err = toApiError(e)
      resendError.value[orderId] = err
      toast.error(err.friendlyMessage())
      return false
    } finally {
      resending.value[orderId] = false
    }
  }

  // key-delivery-gate (PR #49): find the order in local state to patch its status in place after
  // assign/deliver succeeds, so button visibility recomputes without a full page refetch.
  function findOrder(orderId: string) {
    for (const buyer of buyers.value) {
      const order = buyer.orders.find((o) => o.id === orderId)
      if (order) return order
    }
    return undefined
  }

  /**
   * Patches the list row after assign-keys / manual key attach so status + per-item counts recompute
   * without a full reload. List items carry no itemId (AdminBuyerOrderItem), so counts are matched by
   * index: the backend builds both the list row and these responses by iterating `order.Items` in the
   * same order. If the lengths ever disagree, only the status is applied.
   */
  function applyAssignResult(orderId: string, result: { orderStatus: OrderStatus; items: { quantity: number; assigned: number }[] }) {
    const order = findOrder(orderId)
    if (!order) return
    order.status = result.orderStatus
    if (result.items.length !== order.items.length) return
    result.items.forEach((item, i) => {
      order.items[i]!.assignedKeys = item.assigned
    })
  }

  const assigning = ref<Record<string, boolean>>({})
  const assignError = ref<Record<string, ApiError | null>>({})
  const assignSuccess = ref<Record<string, boolean>>({})
  // Not every 200 means keys were actually assigned — `allItemsComplete: false` means stock ran out
  // again, so this tracks that distinct "nothing to do yet" outcome separately from success/error.
  const assignIncomplete = ref<Record<string, string | null>>({})

  // "Asignar": retries auto-assignment (in case stock wasn't available at payment time).
  async function assignKeys(orderId: string) {
    assigning.value[orderId] = true
    assignError.value[orderId] = null
    assignSuccess.value[orderId] = false
    assignIncomplete.value[orderId] = null
    try {
      const order = findOrder(orderId)
      let result: AssignKeysResponse
      try {
        result = await api<AssignKeysResponse>(`/admin/orders/${orderId}/assign-keys`, { method: 'POST' })
      } catch (e) {
        if (!import.meta.dev || !isBackendUnreachable(e)) throw e
        if (!order) throw e
        console.warn('[useAdminBuyers] assign-keys backend unavailable, applying to dev mock data only:', e)
        // Mock fallback simplification: unlike the real backend, always succeeds fully (as if stock
        // just became available) rather than modeling partial stock — good enough for demoing the UI.
        result = {
          orderStatus: 'KeysAssigned',
          allItemsComplete: true,
          items: order.items.map((item, i) => ({ itemId: `${orderId}-item-${i}`, quantity: item.quantity, assignedKeys: item.quantity })),
        }
      }
      applyAssignResult(orderId, { orderStatus: result.orderStatus, items: result.items.map((i) => ({ quantity: i.quantity, assigned: i.assignedKeys })) })
      if (result.allItemsComplete) {
        assignSuccess.value[orderId] = true
      } else {
        const assigned = result.items.reduce((sum, i) => sum + i.assignedKeys, 0)
        const requested = result.items.reduce((sum, i) => sum + i.quantity, 0)
        const message = `Sin stock suficiente: ${assigned} de ${requested} clave(s) asignada(s).`
        assignIncomplete.value[orderId] = message
        toast.warning(message)
      }
      return true
    } catch (e) {
      const err = toApiError(e)
      assignError.value[orderId] = err
      toast.error(err.friendlyMessage())
      return false
    } finally {
      assigning.value[orderId] = false
    }
  }

  const delivering = ref<Record<string, boolean>>({})
  const deliverError = ref<Record<string, ApiError | null>>({})
  const deliverSuccess = ref<Record<string, boolean>>({})

  // "Entregar": only valid when KeysAssigned — API 409s otherwise (e.g. status changed between page
  // load and click), handled the same way as any other ApiError and surfaced as an error toast.
  async function deliverOrder(orderId: string) {
    delivering.value[orderId] = true
    deliverError.value[orderId] = null
    deliverSuccess.value[orderId] = false
    try {
      const order = findOrder(orderId)
      let result: DeliverOrderResponse
      try {
        result = await api<DeliverOrderResponse>(`/admin/orders/${orderId}/deliver`, { method: 'POST' })
      } catch (e) {
        if (!import.meta.dev || !isBackendUnreachable(e)) throw e
        // Mirrors the real 409 gate: only "succeed" against mock data when locally KeysAssigned.
        if (!order || order.status !== 'KeysAssigned') throw e
        console.warn('[useAdminBuyers] deliver backend unavailable, applying to dev mock data only:', e)
        result = { status: 'Delivered' }
      }
      if (order) order.status = result.status
      deliverSuccess.value[orderId] = true
      return true
    } catch (e) {
      const err = toApiError(e)
      deliverError.value[orderId] = err
      toast.error(err.friendlyMessage())
      return false
    } finally {
      delivering.value[orderId] = false
    }
  }

  return {
    email, page, pageSize, buyers, total, status, error, load, search, goToPage,
    resending, resendError, resendSuccess, resendDelivery,
    assigning, assignError, assignSuccess, assignIncomplete, assignKeys, applyAssignResult,
    delivering, deliverError, deliverSuccess, deliverOrder,
  }
}
