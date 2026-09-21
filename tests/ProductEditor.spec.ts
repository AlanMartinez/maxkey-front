import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProductEditor from '~/components/admin/ProductEditor.vue'
import type { AdminProduct } from '~/types/api'

const product: AdminProduct = {
  id: 'p1',
  slug: 'roblox-100',
  name: 'Roblox - 100 Robux',
  platform: 'Cross-platform',
  isActive: true,
  imageKey: 'products/robux.png',
  imageUrl: 'https://cdn/robux.png',
  detailImageKey: undefined,
  detailImageUrl: undefined,
  activationGuide: null,
  activationType: null,
  imageKeys: [],
  images: [],
  description: 'desc',
  variants: [
    { id: 'v1', region: 'AR', edition: 'Standard', price: 9500, oldPrice: undefined, discountPercentage: undefined, currency: 'ARS', sortOrder: 0, isActive: true, isRecommended: true },
    { id: 'v2', region: 'AR', edition: 'Promo', price: 8000, oldPrice: 10000, discountPercentage: 20, currency: 'ARS', sortOrder: 1, isActive: true, isRecommended: false },
  ],
}

describe('ProductEditor', () => {
  it('renders collapsed with a thumbnail, summary, and no form fields', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })

    expect(wrapper.find('img').attributes('src')).toBe('https://cdn/robux.png')
    expect(wrapper.text()).toContain('Roblox - 100 Robux')
    expect(wrapper.text()).toContain('2 variante(s)')
    expect(wrapper.find('input[type="text"]').exists()).toBe(false)
  })

  it('expands to show editable fields on click', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })

    await wrapper.find('button').trigger('click')

    expect((wrapper.findAll('input[required]')[1]!.element as HTMLInputElement).value).toBe('Roblox - 100 Robux')
    expect(wrapper.text()).toContain('Guardar producto')
  })

  it('keeps a legacy platform value selectable so saving does not silently drop it', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    const select = wrapper.find('select[name="platform"]')
    expect((select.element as HTMLSelectElement).value).toBe('Cross-platform')
    expect(select.findAll('option').map((o) => o.text())).toContain('Steam')
  })

  it('emits the selected platform in the save payload', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    await wrapper.find('select[name="platform"]').setValue('Steam')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ platform: 'Steam' })
  })

  it('only shows the discount badge on the variant that actually has one', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    expect(wrapper.text().match(/-\d+%/g)).toEqual(['-20%'])
  })

  it('bold button keeps a trailing space outside the markers, since CommonMark won\'t close emphasis right after whitespace', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    const textarea = wrapper.find('textarea')
    await textarea.setValue('currency ')
    const el = textarea.element as HTMLTextAreaElement
    el.setSelectionRange(0, el.value.length)
    await wrapper.find('button[title="Negrita"]').trigger('click')

    expect(el.value).toBe('**currency** ')
  })

  it('opens a preview modal that renders the description as Markdown', async () => {
    // Teleport renders the modal onto document.body, outside the mounted wrapper's own tree.
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false }, attachTo: document.body })
    await wrapper.find('button').trigger('click')

    await wrapper.find('textarea').setValue('**bold**')
    const previewButton = wrapper.findAll('button').find((b) => b.text() === 'Vista previa')
    await previewButton?.trigger('click')

    expect(document.querySelector('[role="dialog"]')?.innerHTML).toContain('<strong')
  })

  it('starts with the activation guide unchecked and sends null when the product has none', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    const checkbox = wrapper.find('input[name="hasActivationGuide"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.findAll('textarea')).toHaveLength(1)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ activationGuide: null })
  })

  it('checking the guide box reveals a second editor whose Markdown is sent on save', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    await wrapper.find('input[name="hasActivationGuide"]').setValue(true)
    const editors = wrapper.findAll('textarea')
    expect(editors).toHaveLength(2)

    await editors[1]!.setValue('## Paso 1')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ activationGuide: '## Paso 1' })
  })

  it('mounts with the guide box checked when the product already has one', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product: { ...product, activationGuide: 'x' }, saving: false } })
    await wrapper.find('button').trigger('click')

    expect((wrapper.find('input[name="hasActivationGuide"]').element as HTMLInputElement).checked).toBe(true)
    expect((wrapper.findAll('textarea')[1]!.element as HTMLTextAreaElement).value).toBe('x')
  })

  it('groups basic product fields into one named editing section', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    const details = wrapper.find('[role="group"][aria-labelledby="product-details-title-p1"]')
    expect(details.exists()).toBe(true)
    expect(details.find('#product-details-title-p1').text()).toBe('Información básica')
    expect(details.find('input[name="slug"]').exists()).toBe(true)
    expect(details.find('input[name="name"]').exists()).toBe(true)
    expect(details.find('select[name="platform"]').exists()).toBe(true)
  })

  it('keeps primary and additional images in one named section with its add action', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    const images = wrapper.find('section[aria-labelledby="product-images-title-p1"]')
    expect(images.exists()).toBe(true)
    expect(images.find('#product-images-title-p1').text()).toBe('Imágenes')
    expect(images.find('input[aria-label="Clave de imagen principal"]').exists()).toBe(true)

    const addImage = images.findAll('button').find((button) => button.text().includes('Agregar imagen'))
    expect(addImage).toBeDefined()
    await addImage!.trigger('click')
    expect(images.find('input[aria-label="Clave de imagen adicional 1"]').exists()).toBe(true)
  })

  it('exposes product variants as a named section', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    const variants = wrapper.find('section[aria-labelledby="product-variants-title-p1"]')
    expect(variants.exists()).toBe(true)
    expect(variants.find('#product-variants-title-p1').text()).toBe('Variantes')
    expect(variants.findAll('[role="group"]')).toHaveLength(2)
  })
})
