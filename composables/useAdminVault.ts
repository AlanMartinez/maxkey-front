import type { AdminVaultKey, AdminVaultProduct, ToggleVaultProductRequest, ToggleVaultProductResponse, UploadVaultKeysRequest, UploadVaultKeysResponse } from '~/types/api'
import { ApiError } from '~/composables/useApi'

/**
 * Admin vault (vault spec): pre-loaded key stock per variant plus a product-wide auto-fulfillment
 * toggle — one switch per product, not per variant, since the backend applies it to every variant
 * underneath. Toggle and upload state are tracked per id (Record) so multiple rows can act
 * independently, same pattern as `useAdminBuyers`'s per-order resend state.
 */
// DEV-ONLY fixture: PR #48 (maxkey-back) isn't merged yet, so there's no real /admin/vault/*
// backend to hit locally. `import.meta.dev` is compile-time-false in production (same technique
// as the dev admin token in useApi.ts), so this whole branch is dead-code-eliminated in prod builds
// and never used to fall back on a genuine backend error there.
// 10 products, each isolating one scenario the admin vault UI needs to render correctly —
// see the scenario comment on each entry. mock-product-1/2 (and mock-variant-2a specifically)
// predate this expansion and are kept byte-identical: mockKeysForVariant below special-cases
// mock-variant-2a as its empty-state fixture.
const mockVaultProducts: AdminVaultProduct[] = [
  {
    // Multi-variant product with one variant already fully sold out.
    id: 'mock-product-1',
    name: 'Windows 11 Pro (mock)',
    vaultEnabled: true,
    variants: [
      { id: 'mock-variant-1a', region: 'Global', edition: 'Retail', availableCount: 12, assignedCount: 4 },
      { id: 'mock-variant-1b', region: 'EU', edition: 'OEM', availableCount: 0, assignedCount: 9 },
    ],
  },
  {
    // Vault disabled, and its one variant has no region/edition metadata at all.
    id: 'mock-product-2',
    name: 'Office 2021 Pro Plus (mock)',
    vaultEnabled: false,
    variants: [
      { id: 'mock-variant-2a', region: null, edition: null, availableCount: 3, assignedCount: 0 },
    ],
  },
  {
    // Healthy single-variant product, vault enabled, plenty of stock.
    id: 'mock-product-3',
    name: 'Steam Wallet Gift Card (mock)',
    vaultEnabled: true,
    variants: [
      { id: 'mock-variant-3a', region: 'AR', edition: 'Retail', availableCount: 40, assignedCount: 10 },
    ],
  },
  {
    // Vault disabled but still has stock loaded from before it was turned off.
    id: 'mock-product-4',
    name: 'Minecraft Java Edition (mock)',
    vaultEnabled: false,
    variants: [
      { id: 'mock-variant-4a', region: 'Global', edition: 'Retail', availableCount: 25, assignedCount: 15 },
    ],
  },
  {
    // Vault enabled but nothing loaded yet — zero variants.
    id: 'mock-product-5',
    name: 'FIFA 24 Ultimate Edition (mock)',
    vaultEnabled: true,
    variants: [],
  },
  {
    // Near-exhausted stock: heavily assigned relative to what's left available.
    id: 'mock-product-6',
    name: 'Adobe Creative Cloud (mock)',
    vaultEnabled: true,
    variants: [
      { id: 'mock-variant-6a', region: 'Global', edition: 'Suscripción', availableCount: 2, assignedCount: 300 },
    ],
  },
  {
    // Several variants with distinct real-looking region/edition combos.
    id: 'mock-product-7',
    name: 'Grand Theft Auto V (mock)',
    vaultEnabled: true,
    variants: [
      { id: 'mock-variant-7a', region: 'US', edition: 'Retail', availableCount: 18, assignedCount: 6 },
      { id: 'mock-variant-7b', region: 'EU', edition: 'OEM', availableCount: 5, assignedCount: 2 },
      { id: 'mock-variant-7c', region: 'LATAM', edition: 'Retail', availableCount: 30, assignedCount: 1 },
    ],
  },
  {
    // Freshly created variant: nothing loaded, nothing sold (distinct from mock-product-1b's
    // "sold out after being loaded" — this one never had stock to begin with).
    id: 'mock-product-8',
    name: 'Red Dead Redemption 2 (mock)',
    vaultEnabled: true,
    variants: [
      { id: 'mock-variant-8a', region: 'Global', edition: 'Retail', availableCount: 0, assignedCount: 0 },
    ],
  },
  {
    // Long/realistic product name — checks wrapping/truncation in the table.
    id: 'mock-product-9',
    name: 'Microsoft Office 2021 Professional Plus - Licencia Perpetua (mock)',
    vaultEnabled: true,
    variants: [
      { id: 'mock-variant-9a', region: 'Global', edition: 'Retail', availableCount: 14, assignedCount: 6 },
    ],
  },
  {
    // Large numbers — checks formatting/overflow doesn't break the layout.
    id: 'mock-product-10',
    name: 'Xbox Game Pass Ultimate (mock)',
    vaultEnabled: true,
    variants: [
      { id: 'mock-variant-10a', region: 'Global', edition: 'Digital', availableCount: 5000, assignedCount: 12000 },
    ],
  },
]

export async function useAdminVault() {
  const api = useApi()

  async function fetchProducts(): Promise<AdminVaultProduct[]> {
    try {
      return await api<AdminVaultProduct[]>('/admin/vault/products')
    } catch (e) {
      if (import.meta.dev) {
        console.warn('[useAdminVault] /admin/vault/products unavailable, using dev mock data:', e)
        return mockVaultProducts
      }
      throw e
    }
  }

  const { data: products, status, error, refresh } = await useAsyncData('admin-vault', fetchProducts, {
    default: (): AdminVaultProduct[] => [],
  })

  function toApiError(e: unknown) {
    return e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
  }

  const toggling = ref<Record<string, boolean>>({})
  const toggleError = ref<Record<string, ApiError | null>>({})

  async function toggleVault(productId: string, enabled: boolean) {
    toggling.value[productId] = true
    toggleError.value[productId] = null
    try {
      let vaultEnabled = enabled
      try {
        vaultEnabled = (await api<ToggleVaultProductResponse>(`/admin/vault/products/${productId}/toggle`, {
          method: 'PUT',
          body: { enabled } satisfies ToggleVaultProductRequest,
        })).vaultEnabled
      } catch (e) {
        if (!import.meta.dev) throw e
        console.warn('[useAdminVault] toggle backend unavailable, applying to dev mock data only:', e)
      }
      const product = products.value.find((p) => p.id === productId)
      if (product) product.vaultEnabled = vaultEnabled
      return true
    } catch (e) {
      toggleError.value[productId] = toApiError(e)
      return false
    } finally {
      toggling.value[productId] = false
    }
  }

  const uploading = ref<Record<string, boolean>>({})
  const uploadError = ref<Record<string, ApiError | null>>({})
  const uploadSuccess = ref<Record<string, boolean>>({})

  // Vault is write-only — there's no endpoint to list/edit codes already loaded, so the only
  // observable effect of an upload is the counters. Always take availableCount from the response
  // rather than incrementing by codes.length locally: the backend may dedupe/reject some codes.
  function parseCodes(raw: string) {
    return raw.split('\n').map((c) => c.trim()).filter(Boolean)
  }

  async function uploadKeys(productId: string, variantId: string, rawCodes: string) {
    const codes = parseCodes(rawCodes)
    if (!codes.length) return false

    uploading.value[variantId] = true
    uploadError.value[variantId] = null
    uploadSuccess.value[variantId] = false
    try {
      const product = products.value.find((p) => p.id === productId)
      const variant = product?.variants.find((v) => v.id === variantId)
      let availableCount = (variant?.availableCount ?? 0) + codes.length
      try {
        availableCount = (await api<UploadVaultKeysResponse>(`/admin/vault/variants/${variantId}/keys`, {
          method: 'POST',
          body: { codes } satisfies UploadVaultKeysRequest,
        })).availableCount
      } catch (e) {
        if (!import.meta.dev) throw e
        console.warn('[useAdminVault] upload backend unavailable, applying to dev mock data only:', e)
      }
      if (variant) variant.availableCount = availableCount
      uploadSuccess.value[variantId] = true
      return true
    } catch (e) {
      uploadError.value[variantId] = toApiError(e)
      return false
    } finally {
      uploading.value[variantId] = false
    }
  }

  // Dev-only fallback for mock product/variant ids (see mockVaultProducts above), which don't exist
  // in the real backend and would otherwise 404 the real endpoint on every dev run.
  function mockKeysForVariant(variantId: string): AdminVaultKey[] {
    // mock-variant-2a doubles as the empty-state fixture.
    if (variantId === 'mock-variant-2a') return []
    const day = 86_400_000
    const now = Date.now()
    return [
      { keyId: `${variantId}-key-1`, status: 'Available', loadedBy: 'admin@maxkeys.com', createdAt: new Date(now - 5 * day).toISOString(), assignedAt: null, orderItemId: null },
      { keyId: `${variantId}-key-2`, status: 'Assigned', loadedBy: 'admin@maxkeys.com', createdAt: new Date(now - 5 * day).toISOString(), assignedAt: new Date(now - 2 * day).toISOString(), orderItemId: 'mock-order-item-1' },
      { keyId: `${variantId}-key-3`, status: 'Available', loadedBy: 'soporte@maxkeys.com', createdAt: new Date(now - 3 * day).toISOString(), assignedAt: null, orderItemId: null },
      { keyId: `${variantId}-key-4`, status: 'Assigned', loadedBy: 'soporte@maxkeys.com', createdAt: new Date(now - 1 * day).toISOString(), assignedAt: new Date(now - 1 * day).toISOString(), orderItemId: 'mock-order-item-2' },
    ]
  }

  const fetchingKeys = ref<Record<string, boolean>>({})
  const keysError = ref<Record<string, ApiError | null>>({})
  const variantKeys = ref<Record<string, AdminVaultKey[]>>({})

  async function fetchVariantKeys(variantId: string) {
    fetchingKeys.value[variantId] = true
    keysError.value[variantId] = null
    try {
      let keys: AdminVaultKey[]
      try {
        keys = await api<AdminVaultKey[]>(`/admin/vault/variants/${variantId}/keys`)
      } catch (e) {
        if (!import.meta.dev) throw e
        console.warn('[useAdminVault] variant keys backend unavailable, using dev mock data:', e)
        keys = mockKeysForVariant(variantId)
      }
      variantKeys.value[variantId] = keys
      return true
    } catch (e) {
      keysError.value[variantId] = toApiError(e)
      return false
    } finally {
      fetchingKeys.value[variantId] = false
    }
  }

  return {
    products,
    status,
    error,
    refresh,
    toggling,
    toggleError,
    toggleVault,
    uploading,
    uploadError,
    uploadSuccess,
    uploadKeys,
    parseCodes,
    fetchingKeys,
    keysError,
    variantKeys,
    fetchVariantKeys,
  }
}
