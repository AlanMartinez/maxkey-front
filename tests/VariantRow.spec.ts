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
  isRecommended: true,
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

  it('has no per-row save button — ProductEditor reads getBody() on "Guardar producto" instead', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, saving: false } })

    expect(wrapper.findAll('button').map((b) => b.text())).not.toContain('Guardar')
  })

  it('exposes the edited fields via getBody, always recommended (single-variant business rule)', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, saving: false } })

    await wrapper.find('input[placeholder="Región"]').setValue('US')

    const vm = wrapper.vm as unknown as { getBody: () => Record<string, unknown> }
    expect(vm.getBody()).toEqual(
      expect.objectContaining({ region: 'US', edition: 'Standard', price: 9500, currency: 'ARS', sortOrder: 0, isActive: true, isRecommended: true }),
    )
  })

  it('shows a static "Recomendada" badge instead of a picker', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, saving: false } })

    expect(wrapper.text()).toContain('Recomendada')
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false)
  })

  it('exposes the compact editor as a named group with labelled controls', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, saving: false } })

    const row = wrapper.find('[role="group"][aria-label="Variante AR Standard"]')
    expect(row.exists()).toBe(true)
    expect(row.find('input[aria-label="Región"]').exists()).toBe(true)
    expect(row.find('input[aria-label="Edición"]').exists()).toBe(true)
    expect(row.find('input[aria-label="Precio real"]').exists()).toBe(true)
    expect(row.find('input[aria-label="Descuento porcentual"]').exists()).toBe(true)
    expect(row.find('select[aria-label="Moneda"]').exists()).toBe(true)
  })
})
