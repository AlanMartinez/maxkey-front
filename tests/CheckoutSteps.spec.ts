import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CheckoutSteps from '~/components/checkout/CheckoutSteps.vue'

describe('CheckoutSteps', () => {
  it('marks previous steps done, the current one active and the rest pending', async () => {
    const wrapper = await mountSuspended(CheckoutSteps, { props: { current: 1 } })
    const items = wrapper.findAll('li')

    expect(items).toHaveLength(4)
    expect(items.map((li) => li.attributes('data-state'))).toEqual(['done', 'active', 'todo', 'todo'])
    expect(items[1].attributes('aria-current')).toBe('step')
    expect(items[0].attributes('aria-current')).toBeUndefined()
    expect(wrapper.text()).toContain('Tus datos')
  })

  it('shows every step done before the last one on the final step', async () => {
    const wrapper = await mountSuspended(CheckoutSteps, { props: { current: 3 } })
    expect(wrapper.findAll('li').map((li) => li.attributes('data-state'))).toEqual(['done', 'done', 'done', 'active'])
  })
})
