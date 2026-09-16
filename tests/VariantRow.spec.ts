import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import VariantRow from '~/components/admin/VariantRow.vue'
import type { AdminVariant } from '~/types/api'

const variant: AdminVariant = {
  id: 'v1',
  region: 'AR',
  edition: 'Standard',
  price: 9500,
  oldPrice: undefined,
  discountPercentage: undefined,
  currency: 'ARS',
  sortOrder: 0,
  isActive: true,
}

describe('VariantRow', () => {
  it('requires a confirm click before emitting a hard delete', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, saving: false } })

    await wrapper.findAll('button').find((b) => b.text() === 'Eliminar')!.trigger('click')

    expect(wrapper.emitted('delete')).toBeUndefined()
    expect(wrapper.text()).toContain('¿Eliminar definitivamente?')

    await wrapper.findAll('button').find((b) => b.text() === 'Sí, eliminar')!.trigger('click')

    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('shows the discount badge only when a discount is applied', async () => {
    const discounted = { ...variant, oldPrice: 12000, discountPercentage: 20 }
    const wrapper = await mountSuspended(VariantRow, { props: { variant: discounted, saving: false } })

    expect(wrapper.text()).toContain('-20%')
  })

  it('hides the discount badge without one', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, saving: false } })

    expect(wrapper.text()).not.toMatch(/-\d+%/)
  })

  it('emits save with the edited region and edition', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, saving: false } })

    await wrapper.find('input[placeholder="Región"]').setValue('US')
    await wrapper.findAll('button').find((b) => b.text() === 'Guardar')!.trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toEqual(expect.objectContaining({ region: 'US', edition: 'Standard' }))
  })
})
