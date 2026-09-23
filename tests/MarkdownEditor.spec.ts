import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import MarkdownEditor from '~/components/admin/MarkdownEditor.vue'
import AdminImageUpload from '~/components/admin/AdminImageUpload.vue'

mockNuxtImport('useApi', () => () => vi.fn())

describe('MarkdownEditor', () => {
  it('updates the v-model when the admin types', async () => {
    const wrapper = await mountSuspended(MarkdownEditor, { props: { modelValue: '' } })

    await wrapper.find('textarea').setValue('hola')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['hola'])
  })

  it('renders the label above the toolbar only when given', async () => {
    const withLabel = await mountSuspended(MarkdownEditor, { props: { modelValue: '', label: 'Guía' } })
    const withoutLabel = await mountSuspended(MarkdownEditor, { props: { modelValue: '' } })

    expect(withLabel.text()).toContain('Guía')
    expect(withoutLabel.find('span').exists()).toBe(false)
  })

  it('bold button keeps a trailing space outside the markers, since CommonMark won\'t close emphasis right after whitespace', async () => {
    const wrapper = await mountSuspended(MarkdownEditor, { props: { modelValue: 'currency ' } })

    const el = wrapper.find('textarea').element as HTMLTextAreaElement
    el.setSelectionRange(0, el.value.length)
    await wrapper.find('button[title="Negrita"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['**currency** '])
  })

  it('bullet button prefixes every selected line, not just the first', async () => {
    const wrapper = await mountSuspended(MarkdownEditor, { props: { modelValue: 'uno\ndos\ntres' } })

    const el = wrapper.find('textarea').element as HTMLTextAreaElement
    el.setSelectionRange(0, el.value.length)
    await wrapper.find('button[title="Lista con viñetas"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['- uno\n- dos\n- tres'])
  })

  it('shows no image button when imageFolder is not set', async () => {
    const wrapper = await mountSuspended(MarkdownEditor, { props: { modelValue: '' } })
    expect(wrapper.findComponent(AdminImageUpload).exists()).toBe(false)
  })

  it('inserts the uploaded image URL as Markdown at the cursor when imageFolder is set', async () => {
    const wrapper = await mountSuspended(MarkdownEditor, { props: { modelValue: 'Paso 1', imageFolder: '/guides' } })

    await wrapper.findComponent(AdminImageUpload).vm.$emit('uploaded', 'guides/step.png', 'https://ik.imagekit.io/test-account/guides/step.png')

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toContain('![](https://ik.imagekit.io/test-account/guides/step.png)')
  })
})
