import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import SlideForm from '~/components/admin/SlideForm.vue'
import AdminImageUpload from '~/components/admin/AdminImageUpload.vue'
import type { AdminProduct } from '~/types/api'

mockNuxtImport('useApi', () => () => vi.fn())

const products: AdminProduct[] = [{
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
  variants: [],
}]

describe('SlideForm', () => {
  it('uploads staged carousel image on save and uses returned path in payload', async () => {
    const wrapper = await mountSuspended(SlideForm, { props: { products, saving: false } })

    const uploader = wrapper.findComponent(AdminImageUpload)
    expect(uploader.props('folder')).toBe('/carousel')
    const uploadSelected = vi.fn().mockResolvedValue(['/carousel/robux-promo.png'])
    uploader.vm.$emit('register', uploadSelected)
    await wrapper.vm.$nextTick()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(uploadSelected).toHaveBeenCalledOnce()
    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ imageKey: '/carousel/robux-promo.png' })
  })

  it('does not emit carousel save when staged image upload fails', async () => {
    const wrapper = await mountSuspended(SlideForm, { props: { products, saving: false } })
    wrapper.findComponent(AdminImageUpload).vm.$emit('register', vi.fn().mockRejectedValue(new Error('upload failed')))

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('disables carousel uploads while carousel save is running', async () => {
    const wrapper = await mountSuspended(SlideForm, { props: { products, saving: true } })

    expect(wrapper.findComponent(AdminImageUpload).props('disabled')).toBe(true)
  })

  it('hides raw ImageKit paths and shows persisted slide thumbnail in edit form', async () => {
    const wrapper = await mountSuspended(SlideForm, {
      props: {
        products,
        saving: false,
        slide: { id: 's1', productId: 'p1', productName: products[0]!.name, productSlug: products[0]!.slug, productIsActive: true, sortOrder: 0, isActive: true, imageKey: '/carousel/robux.png', imageUrl: 'https://cdn/carousel.png' },
      },
    })

    expect(wrapper.find('input[aria-label="Clave de imagen del carrusel"]').exists()).toBe(false)
    expect(wrapper.find('img[alt="Vista previa del carrusel"]').attributes('src')).toBe('https://cdn/carousel.png')
  })
})
