import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import OrderProgress from '~/components/checkout/OrderProgress.vue'

describe('OrderProgress', () => {
  it('shows key preparation in progress right after payment', async () => {
    const wrapper = await mountSuspended(OrderProgress, { props: { status: 'Paid' } })
    expect(wrapper.findAll('li').map((li) => li.attributes('data-state'))).toEqual(['done', 'active', 'todo'])
  })

  it('keeps preparation active while fulfillment is pending', async () => {
    const wrapper = await mountSuspended(OrderProgress, { props: { status: 'AwaitingFulfillment' } })
    expect(wrapper.findAll('li').map((li) => li.attributes('data-state'))).toEqual(['done', 'active', 'todo'])
  })

  it.each(['KeysAssigned', 'Delivered'] as const)('completes every step once the key is ready (%s)', async (status) => {
    const wrapper = await mountSuspended(OrderProgress, { props: { status } })
    expect(wrapper.findAll('li').map((li) => li.attributes('data-state'))).toEqual(['done', 'done', 'done'])
  })
})
