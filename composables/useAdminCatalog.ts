import type {
  AdminProduct,
  AdminVariant,
  CreateProductRequest,
  CreateProductVariantRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
} from '~/types/api'
import { ApiError } from '~/composables/useApi'

/**
 * Admin catalog editing (admin-catalog spec; design D3). `PUT` always sends the full editable
 * record — no `PATCH`, no separate toggle endpoint; callers re-send the row with `isActive` flipped.
 */
export async function useAdminCatalog() {
  const api = useApi()
  const { data: products, status, error, refresh } = await useAsyncData('admin-catalog', () => api<AdminProduct[]>('/admin/catalog/products'), {
    default: (): AdminProduct[] => [],
  })

  const saving = ref(false)
  const saveError = ref<ApiError | null>(null)

  function toApiError(e: unknown) {
    return e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
  }

  async function saveProduct(id: string, body: UpdateProductRequest) {
    saving.value = true
    saveError.value = null
    try {
      const updated = await api<AdminProduct>(`/admin/catalog/products/${id}`, { method: 'PUT', body })
      const index = products.value.findIndex((p) => p.id === id)
      if (index !== -1) products.value[index] = updated
      return true
    } catch (e) {
      saveError.value = toApiError(e)
      return false
    } finally {
      saving.value = false
    }
  }

  async function saveVariant(productId: string, variantId: string, body: UpdateProductVariantRequest) {
    saving.value = true
    saveError.value = null
    try {
      const updated = await api<AdminVariant>(`/admin/catalog/variants/${variantId}`, { method: 'PUT', body })
      const product = products.value.find((p) => p.id === productId)
      const index = product?.variants.findIndex((v) => v.id === variantId) ?? -1
      if (product && index !== -1) product.variants[index] = updated
      return true
    } catch (e) {
      saveError.value = toApiError(e)
      return false
    } finally {
      saving.value = false
    }
  }

  async function createProduct(body: CreateProductRequest) {
    saving.value = true
    saveError.value = null
    try {
      const created = await api<AdminProduct>('/admin/catalog/products', { method: 'POST', body })
      products.value.push(created)
      return created
    } catch (e) {
      saveError.value = toApiError(e)
      return null
    } finally {
      saving.value = false
    }
  }

  // Backend never deletes the row — it soft-deletes (isActive: false) and returns the updated record.
  async function deleteProduct(id: string) {
    saving.value = true
    saveError.value = null
    try {
      const updated = await api<AdminProduct>(`/admin/catalog/products/${id}`, { method: 'DELETE' })
      const index = products.value.findIndex((p) => p.id === id)
      if (index !== -1) products.value[index] = updated
      return true
    } catch (e) {
      saveError.value = toApiError(e)
      return false
    } finally {
      saving.value = false
    }
  }

  async function createVariant(productId: string, body: CreateProductVariantRequest) {
    saving.value = true
    saveError.value = null
    try {
      const created = await api<AdminVariant>(`/admin/catalog/products/${productId}/variants`, { method: 'POST', body })
      const product = products.value.find((p) => p.id === productId)
      product?.variants.push(created)
      return created
    } catch (e) {
      saveError.value = toApiError(e)
      return null
    } finally {
      saving.value = false
    }
  }

  // Soft-delete, same as deleteProduct — the row stays, isActive flips to false.
  async function deleteVariant(productId: string, variantId: string) {
    saving.value = true
    saveError.value = null
    try {
      const updated = await api<AdminVariant>(`/admin/catalog/variants/${variantId}`, { method: 'DELETE' })
      const product = products.value.find((p) => p.id === productId)
      const index = product?.variants.findIndex((v) => v.id === variantId) ?? -1
      if (product && index !== -1) product.variants[index] = updated
      return true
    } catch (e) {
      saveError.value = toApiError(e)
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    products,
    status,
    error,
    refresh,
    saving,
    saveError,
    saveProduct,
    saveVariant,
    createProduct,
    deleteProduct,
    createVariant,
    deleteVariant,
  }
}
