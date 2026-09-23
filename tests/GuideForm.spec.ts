import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import GuideForm from '~/components/admin/GuideForm.vue'
import type { GuideDto } from '~/types/api'

mockNuxtImport('useApi', () => () => vi.fn())

const guide: GuideDto = { id: 'g1', slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '## Paso 1' }

describe('GuideForm', () => {
  it('renders empty fields with no guide prop', async () => {
    const wrapper = await mountSuspended(GuideForm, { props: { saving: false } })
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('')
  })

  it('pre-fills fields from an existing guide', async () => {
    const wrapper = await mountSuspended(GuideForm, { props: { guide, saving: false } })
    const inputs = wrapper.findAll('input[type="text"]')
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('example-activation-guide')
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('Ejemplo')
  })

  it('emits save with the trimmed slug/title and current content', async () => {
    const wrapper = await mountSuspended(GuideForm, { props: { guide, saving: false } })
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '## Paso 1' })
  })

  it('does not emit save when slug is blank', async () => {
    const wrapper = await mountSuspended(GuideForm, { props: { saving: false } })
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')).toBeUndefined()
  })
})
