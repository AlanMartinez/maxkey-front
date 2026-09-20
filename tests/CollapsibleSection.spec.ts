import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CollapsibleSection from '~/components/product/CollapsibleSection.vue'

function mountSection(props: Record<string, unknown> = {}) {
  return mount(CollapsibleSection, {
    props: { id: 'guide', title: 'Guía de activación', ...props },
    slots: { default: '<p>contenido</p>' },
  })
}

describe('CollapsibleSection', () => {
  it('is closed by default and hides the content without removing it from the DOM', () => {
    const wrapper = mountSection()

    const content = wrapper.find('#guide-content')
    expect(content.exists()).toBe(true)
    expect(content.attributes('style')).toContain('display: none')
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('false')
  })

  it('toggles aria-expanded and content visibility on header click', async () => {
    const wrapper = mountSection()

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#guide-content').attributes('style') ?? '').not.toContain('display: none')
  })

  it('emits update:open so the parent can control the section', async () => {
    const wrapper = mountSection({ open: false })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
  })
})
