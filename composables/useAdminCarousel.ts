import type { AdminCarouselSlideDto, AdminProduct, CarouselSlideRequest } from '~/types/api'
import { ApiError } from '~/composables/useApi'

/**
 * Admin carousel editing (carousel spec; design D2). `POST`/`PUT` always send the full
 * `CarouselSlideRequest` — reorders and toggles re-send the same shape. Also loads the admin
 * product list so the caller can render a product picker without a second page-level fetch.
 */
export async function useAdminCarousel() {
  const api = useApi()
  // Must run before the first `await`: composables lose the Nuxt instance after an await in an async setup.
  const toast = useToast()
  const slidesAsync = useAsyncData('admin-carousel', () => api<AdminCarouselSlideDto[]>('/admin/carousel'), { default: () => [] })
  const productsAsync = useAsyncData('admin-carousel-products', () => api<AdminProduct[]>('/admin/catalog/products'), { default: () => [] })
  const [{ data: slides, status, error, refresh }, { data: products }] = await Promise.all([slidesAsync, productsAsync])

  const saving = ref(false)
  const saveError = ref<ApiError | null>(null)

  function toApiError(e: unknown) {
    return e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
  }

  // Every save failure lands as a floating toast (useToast.ts); `saveError` stays exposed as state.
  function failSave(e: unknown) {
    const err = toApiError(e)
    saveError.value = err
    toast.error(err.friendlyMessage())
  }

  async function createSlide(body: CarouselSlideRequest) {
    saving.value = true
    saveError.value = null
    try {
      const created = await api<AdminCarouselSlideDto>('/admin/carousel', { method: 'POST', body })
      slides.value = [...slides.value, created]
      return true
    } catch (e) {
      failSave(e)
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateSlide(id: string, body: CarouselSlideRequest) {
    saving.value = true
    saveError.value = null
    try {
      const updated = await api<AdminCarouselSlideDto>(`/admin/carousel/${id}`, { method: 'PUT', body })
      const index = slides.value.findIndex((s) => s.id === id)
      if (index !== -1) slides.value[index] = updated
      return true
    } catch (e) {
      failSave(e)
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteSlide(id: string) {
    saving.value = true
    saveError.value = null
    try {
      await api(`/admin/carousel/${id}`, { method: 'DELETE' })
      slides.value = slides.value.filter((s) => s.id !== id)
      return true
    } catch (e) {
      failSave(e)
      return false
    } finally {
      saving.value = false
    }
  }

  return { slides, products, status, error, refresh, saving, saveError, createSlide, updateSlide, deleteSlide }
}
