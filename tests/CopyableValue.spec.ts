import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CopyableValue from '~/components/ui/CopyableValue.vue'

const writeText = vi.fn().mockResolvedValue(undefined)
const ID = '2b2da360-84d5-494f-ac4d-64a74d085663'

beforeEach(() => {
  writeText.mockClear()
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  // happy-dom ships a no-op ResizeObserver; drop it so the component falls back to window resize,
  // which the test can fire by hand.
  vi.stubGlobal('ResizeObserver', undefined)
})
afterEach(() => vi.unstubAllGlobals())

// happy-dom has no layout, so clipping is simulated by overriding the measured widths on the text span.
function clip(wrapper: ReturnType<typeof mount>, scrollWidth: number, clientWidth: number) {
  const el = wrapper.find('span span').element
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true })
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true })
  window.dispatchEvent(new Event('resize'))
  return wrapper.vm.$nextTick()
}

describe('CopyableValue', () => {
  it('truncates visually, keeps the full value on hover and hides the copy button while nothing is clipped', async () => {
    const wrapper = mount(CopyableValue, { props: { value: ID } })
    await clip(wrapper, 100, 200)

    const text = wrapper.find('span span')
    expect(text.classes()).toContain('truncate')
    expect(text.attributes('title')).toBe(ID)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows the copy button only once the text is clipped, and copies the full value', async () => {
    vi.useFakeTimers()
    const wrapper = mount(CopyableValue, { props: { value: ID } })
    await clip(wrapper, 300, 100)

    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBe('Copiar')
    await button.trigger('click')

    expect(writeText).toHaveBeenCalledWith(ID)
    expect(button.attributes('aria-label')).toBe('Copiado')

    vi.advanceTimersByTime(1500)
    await wrapper.vm.$nextTick()
    expect(button.attributes('aria-label')).toBe('Copiar')

    // Widening the container past the text hides the button again.
    await clip(wrapper, 300, 400)
    expect(wrapper.find('button').exists()).toBe(false)
    vi.useRealTimers()
  })
})
