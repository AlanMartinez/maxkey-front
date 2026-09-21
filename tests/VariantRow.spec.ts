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
  isRecommended: false,
}

describe('VariantRow', () => {
  it('requires a confirm click before emitting a hard delete', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, productId: 'p1', saving: false } })

    await wrapper.findAll('button').find((b) => b.text() === 'Eliminar')!.trigger('click')

    expect(wrapper.emitted('delete')).toBeUndefined()
    expect(wrapper.text()).toContain('¿Eliminar definitivamente?')

    await wrapper.findAll('button').find((b) => b.text() === 'Sí, eliminar')!.trigger('click')

    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('shows the discount badge only when a discount is applied', async () => {
    const discounted = { ...variant, oldPrice: 12000, discountPercentage: 20 }
    const wrapper = await mountSuspended(VariantRow, { props: { variant: discounted, productId: 'p1', saving: false } })

    expect(wrapper.text()).toContain('-20%')
  })

  it('hides the discount badge without one', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, productId: 'p1', saving: false } })

    expect(wrapper.text()).not.toMatch(/-\d+%/)
  })

  it('emits save with the edited region and edition', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, productId: 'p1', saving: false } })

    await wrapper.find('input[placeholder="Región"]').setValue('US')
    await wrapper.findAll('button').find((b) => b.text() === 'Guardar')!.trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toEqual(expect.objectContaining({ region: 'US', edition: 'Standard' }))
  })

  it('always carries the current isRecommended value on a regular save', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant: { ...variant, isRecommended: true }, productId: 'p1', saving: false } })

    await wrapper.findAll('button').find((b) => b.text() === 'Guardar')!.trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toEqual(expect.objectContaining({ isRecommended: true }))
  })

  it('saves the full record with isRecommended true when the radio is picked', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, productId: 'p1', saving: false } })

    await wrapper.find('input[type="radio"]').setValue(true)

    expect(wrapper.emitted('save')?.[0]?.[0]).toEqual(
      expect.objectContaining({ isRecommended: true, price: 9500, currency: 'ARS', region: 'AR', edition: 'Standard', sortOrder: 0, isActive: true }),
    )
  })

  it('renders the recommended control as a radio grouped by product, reflecting the server flag', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant: { ...variant, isRecommended: true }, productId: 'p1', saving: false } })

    const radio = wrapper.find('input[type="radio"]')
    expect(radio.attributes('name')).toBe('recommended-p1')
    expect((radio.element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.find('input[type="checkbox"][name]').exists()).toBe(false)
  })

  it('exposes the compact editor as a named group with labelled controls', async () => {
    const wrapper = await mountSuspended(VariantRow, { props: { variant, productId: 'p1', saving: false } })

    const row = wrapper.find('[role="group"][aria-label="Variante AR Standard"]')
    expect(row.exists()).toBe(true)
    expect(row.find('input[aria-label="Región"]').exists()).toBe(true)
    expect(row.find('input[aria-label="Edición"]').exists()).toBe(true)
    expect(row.find('input[aria-label="Precio real"]').exists()).toBe(true)
    expect(row.find('input[aria-label="Descuento porcentual"]').exists()).toBe(true)
    expect(row.find('select[aria-label="Moneda"]').exists()).toBe(true)
  })
})
