import type { GuideDto, GuideRequest } from '~/types/api'
import { ApiError } from '~/composables/useApi'

/** Admin guide editing (activation-guides spec). Hard delete; a 409 means the guide is still linked to a product. */
export async function useAdminGuides() {
  const api = useApi()
  const toast = useToast()
  const { data: guides, status, error, refresh } = await useAsyncData('admin-guides', () => api<GuideDto[]>('/admin/guides'), { default: (): GuideDto[] => [] })

  const saving = ref(false)
  const saveError = ref<ApiError | null>(null)

  function toApiError(e: unknown) {
    return e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
  }

  function failSave(e: unknown) {
    const err = toApiError(e)
    saveError.value = err
    toast.error(err.friendlyMessage())
  }

  async function createGuide(body: GuideRequest) {
    saving.value = true
    saveError.value = null
    try {
      const created = await api<GuideDto>('/admin/guides', { method: 'POST', body })
      guides.value = [...guides.value, created]
      return true
    } catch (e) {
      failSave(e)
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateGuide(id: string, body: GuideRequest) {
    saving.value = true
    saveError.value = null
    try {
      const updated = await api<GuideDto>(`/admin/guides/${id}`, { method: 'PUT', body })
      const index = guides.value.findIndex((g) => g.id === id)
      if (index !== -1) guides.value[index] = updated
      return true
    } catch (e) {
      failSave(e)
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteGuide(id: string) {
    saving.value = true
    saveError.value = null
    try {
      await api(`/admin/guides/${id}`, { method: 'DELETE' })
      guides.value = guides.value.filter((g) => g.id !== id)
      return true
    } catch (e) {
      failSave(e)
      return false
    } finally {
      saving.value = false
    }
  }

  return { guides, status, error, refresh, saving, saveError, createGuide, updateGuide, deleteGuide }
}
