import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CatalogFilters from '~/components/admin/CatalogFilters.vue'
import { DEFAULT_CATALOG_FILTERS } from '~/utils/adminCatalogFilter'

const baseProps = {
  modelValue: { ...DEFAULT_CATALOG_FILTERS },
  platforms: [
    { value: 'Steam', count: 3 },
    { value: 'Roblox', count: 1 },
  ],
  shown: 2,
  total: 4,
  active: false,
}

describe('CatalogFilters', () => {
  it('lists platforms with their counts and shows the result count', async () => {
    const wrapper = await mountSuspended(CatalogFilters, { props: baseProps })

    const options = wrapper.find('[data-testid="filter-platform"]').findAll('option').map((o) => o.text())
    expect(options).toEqual(['Todas', 'Steam (3)', 'Roblox (1)'])
    expect(wrapper.find('[data-testid="filter-count"]').text()).toBe('2 de 4 productos')
  })

  it('emits the whole filter object with the changed field', async () => {
    const wrapper = await mountSuspended(CatalogFilters, { props: baseProps })

    await wrapper.find('[data-testid="filter-platform"]').setValue('Roblox')
    await wrapper.find('[data-testid="filter-review"]').setValue('no-image')

    const updates = wrapper.emitted('update:modelValue') as unknown[][]
    expect(updates[0]?.[0]).toEqual({ ...DEFAULT_CATALOG_FILTERS, platform: 'Roblox' })
    expect(updates.at(-1)?.[0]).toMatchObject({ review: 'no-image' })
  })

  it('offers clearing only while filters are active', async () => {
    const idle = await mountSuspended(CatalogFilters, { props: baseProps })
    expect(idle.text()).not.toContain('Limpiar filtros')

    const active = await mountSuspended(CatalogFilters, { props: { ...baseProps, active: true } })
    await active.findAll('button').find((b) => b.text() === 'Limpiar filtros')?.trigger('click')
    expect(active.emitted('clear')).toHaveLength(1)
  })
})
