import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import OrderDetailDialog from '~/components/admin/OrderDetailDialog.vue'
import type { AdminOrderDetail, AdminOrderDetailItem } from '~/types/api'

function item(itemId: string, quantity: number, keys: number): AdminOrderDetailItem {
  return {
    itemId,
    productName: `Product ${itemId}`,
    variantName: 'Global',
    unitPrice: 1000,
    quantity,
    keys: Array.from({ length: keys }, (_, k) => ({ keyId: `${itemId}-key-${k}`, status: 'Assigned' as const, assignedAt: '2026-01-01T00:06:00Z', revealedAt: null, revealedBy: null })),
  }
}

function detailWith(items: AdminOrderDetailItem[]): AdminOrderDetail {
  return {
    id: 'order-1',
    buyerEmail: 'buyer@example.com',
    status: 'AwaitingFulfillment',
    totalAmount: 9990,
    currency: 'ARS',
    createdAt: '2026-01-01T00:00:00Z',
    paidAt: '2026-01-01T00:05:00Z',
    deliveredAt: null,
    updatedAt: '2026-01-01T00:05:00Z',
    mpPaymentId: null,
    lastPaymentAttemptStatus: null,
    lastPaymentAttemptAt: null,
    items,
    events: [],
  }
}

async function mount(detail: AdminOrderDetail, attaching: Record<string, boolean> = reactive({})) {
  // Teleport renders the modal onto document.body, outside the mounted wrapper's own tree.
  return mountSuspended(OrderDetailDialog, {
    props: { orderId: 'order-1', detail, status: 'success', error: null, attaching },
    attachTo: document.body,
  })
}

function attachForms() {
  return Array.from(document.querySelectorAll<HTMLFormElement>('form[data-attach-form]'))
}

describe('OrderDetailDialog manual key attach', () => {
  it('renders the "Cargar key" form only for items still short of keys', async () => {
    const wrapper = await mount(detailWith([item('short', 2, 1), item('full', 1, 1), item('empty', 1, 0)]))

    expect(attachForms().map((f) => f.dataset.attachForm)).toEqual(['short', 'empty'])
    // Still a read-only view for the complete item: no input, no button.
    expect(document.querySelector('form[data-attach-form="full"]')).toBeNull()
    wrapper.unmount()
  })

  it('never offers the form outside AwaitingFulfillment, even for a short item', async () => {
    for (const status of ['KeysAssigned', 'Delivered', 'Paid'] as const) {
      const wrapper = await mount({ ...detailWith([item('short', 2, 1)]), status })
      expect(attachForms()).toHaveLength(0)
      wrapper.unmount()
    }
  })

  it('emits attach with the itemId and the typed code on submit', async () => {
    const wrapper = await mount(detailWith([item('short', 2, 1)]))

    const input = document.querySelector<HTMLInputElement>('form[data-attach-form="short"] input')!
    input.value = 'ABCD-1234'
    input.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()
    attachForms()[0]!.dispatchEvent(new Event('submit', { cancelable: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('attach')).toEqual([['short', 'ABCD-1234']])
    wrapper.unmount()
  })

  it('shows the button as loading while that item is attaching and does not re-emit', async () => {
    const attaching = reactive<Record<string, boolean>>({ short: true })
    const wrapper = await mount(detailWith([item('short', 2, 1)]), attaching)

    const button = document.querySelector<HTMLButtonElement>('form[data-attach-form="short"] button')!
    expect(button.getAttribute('aria-busy')).toBe('true')
    attachForms()[0]!.dispatchEvent(new Event('submit', { cancelable: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('attach')).toBeUndefined()
    wrapper.unmount()
  })

  it('clears the draft code once the refetched detail shows the key landed, and hides the form when complete', async () => {
    const wrapper = await mount(detailWith([item('short', 2, 0)]))

    const input = document.querySelector<HTMLInputElement>('form[data-attach-form="short"] input')!
    input.value = 'ABCD-1234'
    input.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()

    await wrapper.setProps({ detail: detailWith([item('short', 2, 1)]) })
    expect(document.querySelector<HTMLInputElement>('form[data-attach-form="short"] input')!.value).toBe('')

    await wrapper.setProps({ detail: detailWith([item('short', 2, 2)]) })
    expect(attachForms()).toHaveLength(0)
    wrapper.unmount()
  })
})

describe('OrderDetailDialog deliver action', () => {
  it('shows "Entregar" only once the order is KeysAssigned and emits deliver', async () => {
    const wrapper = await mount({ ...detailWith([item('full', 1, 1)]), status: 'KeysAssigned' })

    const button = document.querySelector<HTMLButtonElement>('[data-testid="detail-deliver"]')
    expect(button?.textContent).toContain('Entregar')
    button!.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('deliver')).toEqual([[]])
    wrapper.unmount()
  })

  it('hides "Entregar" while keys are still missing or once delivered', async () => {
    for (const status of ['AwaitingFulfillment', 'Delivered'] as const) {
      const wrapper = await mount({ ...detailWith([item('full', 1, 1)]), status })
      expect(document.querySelector('[data-testid="detail-deliver"]')).toBeNull()
      wrapper.unmount()
    }
  })
})

describe('OrderDetailDialog identifiers', () => {
  it('renders the order id, payment id and key ids as copyable values with the full id on hover', async () => {
    const wrapper = await mount({
      ...detailWith([item('full', 1, 1)]),
      id: '2b2da360-84d5-494f-ac4d-64a74d085663',
      mpPaymentId: '123456789012',
    })

    const fullValues = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] [data-copyable] [title]')).map((el) => el.title)
    expect(fullValues).toEqual(['2b2da360-84d5-494f-ac4d-64a74d085663', '123456789012', 'full-key-0'])
    wrapper.unmount()
  })
})
