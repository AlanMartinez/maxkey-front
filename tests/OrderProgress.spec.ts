import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import OrderProgress from '~/components/checkout/OrderProgress.vue'

describe('OrderProgress', () => {
  it('shows key preparation in progress right after payment', async () => {
    const wrapper = await mountSuspended(OrderProgress, { props: { status: 'Paid' } })
    expect(wrapper.findAll('li').map((li) => li.attributes('data-state'))).toEqual(['done', 'active', 'todo'])
    expect(wrapper.text()).toContain('Preparando tu key')
  })

  // KeysAssigned is internal: the admin still has to confirm delivery, so the buyer cannot see the key yet.
  it.each(['AwaitingFulfillment', 'KeysAssigned'] as const)('keeps preparation active while the key is not delivered (%s)', async (status) => {
    const wrapper = await mountSuspended(OrderProgress, { props: { status } })
    expect(wrapper.findAll('li').map((li) => li.attributes('data-state'))).toEqual(['done', 'active', 'todo'])
  })

  it('completes every step only once the order is Delivered', async () => {
    const wrapper = await mountSuspended(OrderProgress, { props: { status: 'Delivered' } })
    expect(wrapper.findAll('li').map((li) => li.attributes('data-state'))).toEqual(['done', 'done', 'done'])
  })
})
