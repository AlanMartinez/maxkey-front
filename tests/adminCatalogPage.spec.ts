import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { type VueWrapper, flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { AdminProduct } from '~/types/api'
import type { PermanentDeleteResult } from '~/composables/useAdminCatalog'
import CatalogPage from '~/pages/admin/catalog.vue'

const product: AdminProduct = {
  id: 'p1',
  slug: 'roblox-100',
  name: 'Roblox - 100 Robux',
  platform: 'Cross-platform',
  isActive: true,
  imageKey: undefined,
  imageUrl: '',
  detailImageKey: undefined,
  detailImageUrl: undefined,
  activationGuideId: null,
  activationType: null,
  imageKeys: [],
  images: [],
  description: '',
  variants: [],
}

const permanentlyDeleteMock = vi.fn<(id: string, force?: boolean) => Promise<PermanentDeleteResult>>()
const softDeleteMock = vi.fn(async () => true)

mockNuxtImport('useAdminCatalog', () => async () => ({
  products: ref([product]),
  status: ref('success'),
  error: ref(null),
  refresh: vi.fn(),
  saving: ref(false),
  saveError: ref(null),
  saveProduct: vi.fn(async () => true),
  saveVariant: vi.fn(async () => true),
  createProduct: vi.fn(async () => null),
  deleteProduct: softDeleteMock,
  permanentlyDeleteProduct: permanentlyDeleteMock,
  createVariant: vi.fn(async () => null),
  deleteVariant: vi.fn(async () => true),
}))
// AdminImageUpload (inside ProductEditor) builds an API client on setup.
mockNuxtImport('useApi', () => () => vi.fn())
mockNuxtImport('useAdminGuides', () => async () => ({ guides: ref([]) }))

let wrapper: VueWrapper | undefined

function dialog() {
  return document.body.querySelector<HTMLElement>('[role="dialog"]')
}
function dialogButton(label: string) {
  return Array.from(dialog()?.querySelectorAll<HTMLButtonElement>('button') ?? []).find((b) => b.textContent?.trim() === label)
}

async function openPermanentDelete() {
  const page = await mountSuspended(CatalogPage)
  wrapper = page
  // Expand the product card, then click the red hard-delete button.
  await page.find('#catalog-product-p1 button').trigger('click')
  await page.findAll('button').find((b) => b.text() === 'Eliminar producto')!.trigger('click')
  await flushPromises()
}

beforeEach(() => {
  permanentlyDeleteMock.mockReset()
  softDeleteMock.mockClear()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('pages/admin/catalog permanent delete', () => {
  it('asks for confirmation first and does not call the API until confirmed', async () => {
    await openPermanentDelete()

    expect(dialog()?.textContent).toContain('no se puede deshacer')
    expect(permanentlyDeleteMock).not.toHaveBeenCalled()
  })

  it('shows only the first confirmation when the product has no available keys', async () => {
    permanentlyDeleteMock.mockResolvedValueOnce({ status: 'deleted' })
    await openPermanentDelete()

    dialogButton('Eliminar producto')!.click()
    await flushPromises()

    expect(permanentlyDeleteMock).toHaveBeenCalledTimes(1)
    expect(permanentlyDeleteMock).toHaveBeenCalledWith('p1', false)
    expect(dialog()).toBeNull()
    expect(softDeleteMock).not.toHaveBeenCalled()
  })

  it('shows the available-keys warning on 409 and retries with force on confirm', async () => {
    permanentlyDeleteMock.mockResolvedValueOnce({ status: 'hasAvailableKeys', availableKeys: 3 }).mockResolvedValueOnce({ status: 'deleted' })
    await openPermanentDelete()

    dialogButton('Eliminar producto')!.click()
    await flushPromises()

    expect(dialog()?.textContent).toContain('3 keys disponibles en el vault')
    expect(dialog()?.textContent).toContain('sin producto asociado')

    dialogButton('Eliminar igual')!.click()
    await flushPromises()

    expect(permanentlyDeleteMock).toHaveBeenNthCalledWith(2, 'p1', true)
    expect(dialog()).toBeNull()
  })

  it('does nothing when the available-keys warning is cancelled', async () => {
    permanentlyDeleteMock.mockResolvedValueOnce({ status: 'hasAvailableKeys', availableKeys: 1 })
    await openPermanentDelete()

    dialogButton('Eliminar producto')!.click()
    await flushPromises()
    expect(dialog()?.textContent).toContain('1 key disponible en el vault')

    dialogButton('Cancelar')!.click()
    await flushPromises()

    expect(permanentlyDeleteMock).toHaveBeenCalledTimes(1)
    expect(dialog()).toBeNull()
  })

  it('closes the dialog after a failed delete (the composable already toasted the error)', async () => {
    permanentlyDeleteMock.mockResolvedValueOnce({ status: 'failed' })
    await openPermanentDelete()

    dialogButton('Eliminar producto')!.click()
    await flushPromises()

    expect(dialog()).toBeNull()
  })
})
