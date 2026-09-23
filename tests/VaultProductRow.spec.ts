import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import VaultProductRow from '~/components/admin/VaultProductRow.vue'
import VaultVariantRow from '~/components/admin/VaultVariantRow.vue'
import type { AdminVaultProduct } from '~/types/api'

const product: AdminVaultProduct = {
  id: 'p1',
  name: 'Windows 11 Pro',
  vaultEnabled: false,
  variants: [
    { id: 'v1', region: 'Global', edition: 'Retail', availableCount: 12, assignedCount: 4 },
    { id: 'v2', region: 'EU', edition: 'OEM', availableCount: 9, assignedCount: 1 },
  ],
}

const props = {
  product,
  toggling: false,
  uploading: {},
  uploadSuccess: {},
  fetchingKeys: {},
  keysError: {},
  variantKeys: {},
  initiallyExpanded: true,
}

describe('VaultProductRow', () => {
  it('opens sole variant key upload controls with product expansion', async () => {
    const wrapper = await mountSuspended(VaultProductRow, { props })

    expect(wrapper.findAllComponents(VaultVariantRow)).toHaveLength(1)
    expect(wrapper.findComponent(VaultVariantRow).props('variant')).toMatchObject({ id: 'v1' })
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.text()).toContain('Auto-entrega')
    expect(wrapper.text()).not.toContain('aplica a todas las variantes')
    expect(wrapper.text()).not.toContain('variante(s)')
    expect((wrapper.find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(false)
  })
})
