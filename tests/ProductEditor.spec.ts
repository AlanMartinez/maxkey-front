import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import ProductEditor from '~/components/admin/ProductEditor.vue'
import AdminImageUpload from '~/components/admin/AdminImageUpload.vue'
import type { AdminProduct } from '~/types/api'

mockNuxtImport('useApi', () => () => vi.fn())

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

  it('keeps primary and additional images in one named section with compact upload controls', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    const images = wrapper.find('section[aria-labelledby="product-images-title-p1"]')
    expect(images.exists()).toBe(true)
    expect(images.find('#product-images-title-p1').text()).toBe('Imágenes')
    expect(images.find('input[aria-label="Clave de imagen principal"]').exists()).toBe(false)
    expect(images.findAllComponents(AdminImageUpload)).toHaveLength(2)
    expect(images.text()).not.toContain('products/robux.png')
  })

  it('keeps catalog cover and product gallery as distinct media controls with separate previews', async () => {
    const wrapper = await mountSuspended(ProductEditor, {
      props: {
        product: {
          ...product,
          imageKeys: ['/products/gallery.png'],
          images: ['https://cdn/gallery.png'],
        },
        saving: false,
      },
    })
    await wrapper.find('button').trigger('click')

    const cover = wrapper.find('[data-testid="catalog-cover"]')
    const gallery = wrapper.find('[data-testid="product-gallery"]')

    expect(cover.text()).toContain('Portada de catálogo')
    expect(cover.text()).toContain('Cambiar portada')
    expect(cover.find('img').attributes('src')).toBe('https://cdn/robux.png')
    expect(gallery.text()).toContain('Galería de producto')
    expect(gallery.text()).toContain('Agregar imágenes')
    expect(gallery.find('img[alt="Roblox - 100 Robux, imagen adicional 1"]').attributes('src')).toBe('https://cdn/gallery.png')
    expect(cover.findAllComponents(AdminImageUpload)).toHaveLength(1)
    expect(gallery.findAllComponents(AdminImageUpload)).toHaveLength(1)
  })

  it('updates cover and gallery previews independently before save', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    const [coverUpload, galleryUpload] = wrapper.findAllComponents(AdminImageUpload)
    coverUpload!.vm.$emit('preview', ['blob:cover'])
    galleryUpload!.vm.$emit('preview', ['blob:gallery'])
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="catalog-cover"] img').attributes('src')).toBe('blob:cover')
    expect(wrapper.find('[data-testid="product-gallery"] img[alt="Vista previa de galería"]').attributes('src')).toBe('blob:gallery')
  })

  it('does not use an uploaded event before save', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    const [primaryUpload] = wrapper.findAllComponents(AdminImageUpload)
    primaryUpload!.vm.$emit('uploaded', '/products/robux-new.png')
    await wrapper.vm.$nextTick()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ imageKey: 'products/robux.png' })
  })

  it('uploads staged cover on save and includes returned key in parent payload', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    const [coverUpload] = wrapper.findAllComponents(AdminImageUpload)
    const uploadSelected = vi.fn().mockResolvedValue(['/products/robux-new.png'])
    coverUpload!.vm.$emit('register', uploadSelected)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(uploadSelected).toHaveBeenCalledOnce()
    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ imageKey: '/products/robux-new.png' })
  })

  it('does not emit product save when staged cover upload fails', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    const [coverUpload] = wrapper.findAllComponents(AdminImageUpload)
    coverUpload!.vm.$emit('register', vi.fn().mockRejectedValue(new Error('upload failed')))

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('uses gallery ImageKit paths returned during save payload', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    await wrapper.vm.$nextTick()
    const uploads = wrapper.findAllComponents(AdminImageUpload)
    uploads[1]!.vm.$emit('register', vi.fn().mockResolvedValue(['/products/robux-gallery.png']))
    await wrapper.vm.$nextTick()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ imageKeys: ['/products/robux-gallery.png'] })
  })

  it('renders persisted gallery URLs as thumbnails without exposing storage paths', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product: { ...product, imageKeys: ['/products/gallery.png'], images: ['https://cdn/gallery.png'] }, saving: false } })
    await wrapper.find('button').trigger('click')

    expect(wrapper.find('img[alt="Roblox - 100 Robux, imagen adicional 1"]').attributes('src')).toBe('https://cdn/gallery.png')
    expect(wrapper.text()).not.toContain('/products/gallery.png')
  })

  it('exposes product variants as a named section', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    const variants = wrapper.find('section[aria-labelledby="product-variants-title-p1"]')
    expect(variants.exists()).toBe(true)
    expect(variants.find('#product-variants-title-p1').text()).toBe('Variantes')
    expect(variants.findAll('[role="group"]')).toHaveLength(2)
  })

  it('hides "+ Agregar variante" once the product already has one — code-enforced single-variant rule', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    expect(wrapper.findAll('button').find((b) => b.text() === '+ Agregar variante')).toBeUndefined()
  })

  it('shows "+ Agregar variante" when the product has none yet', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product: { ...product, variants: [] }, saving: false } })
    await wrapper.find('button').trigger('click')

    expect(wrapper.findAll('button').find((b) => b.text() === '+ Agregar variante')).toBeDefined()
  })

  it('saves every variant row together with the product on "Guardar producto" — no per-row save button', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false } })
    await wrapper.find('button').trigger('click')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const saveVariantCalls = wrapper.emitted('saveVariant')
    expect(saveVariantCalls).toHaveLength(2)
    expect(saveVariantCalls?.[0]).toEqual(['v1', expect.objectContaining({ region: 'AR', edition: 'Standard', isRecommended: true })])
    expect(saveVariantCalls?.[1]).toEqual(['v2', expect.objectContaining({ region: 'AR', edition: 'Promo', isRecommended: true })])
  })
})
