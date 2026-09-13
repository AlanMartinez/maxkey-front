import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import KeyReveal from '~/components/orders/KeyReveal.vue'

const writeText = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  writeText.mockClear()
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
})

describe('KeyReveal', () => {
  it('renders nothing when there is no code', () => {
    const wrapper = mount(KeyReveal, { props: {} })

    expect(wrapper.find('.key-reveal').exists()).toBe(false)
  })

  it('hides the code by default and reveals it on click', async () => {
    const wrapper = mount(KeyReveal, { props: { code: 'ABCD-1234' } })

    expect(wrapper.text()).not.toContain('ABCD-1234')
    const [revealButton] = wrapper.findAll('button')
    await revealButton?.trigger('click')

    expect(wrapper.text()).toContain('ABCD-1234')
    expect(revealButton?.text()).toBe('Ocultar')
  })

  it('copies the code to a stubbed clipboard and shows feedback', async () => {
    const wrapper = mount(KeyReveal, { props: { code: 'ABCD-1234' } })

    const [, copyButton] = wrapper.findAll('button')
    await copyButton?.trigger('click')
    await nextTick()
    await nextTick()

    expect(writeText).toHaveBeenCalledWith('ABCD-1234')
    expect(wrapper.text()).toContain('Copiado')
  })
})
