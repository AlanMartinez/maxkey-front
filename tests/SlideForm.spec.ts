import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
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
  it('uses carousel upload paths in its save payload', async () => {
    const wrapper = await mountSuspended(SlideForm, { props: { products, saving: false } })

    const uploader = wrapper.findComponent(AdminImageUpload)
    expect(uploader.props('folder')).toBe('/carousel')
    uploader.vm.$emit('uploaded', '/carousel/robux-promo.png')
    await wrapper.vm.$nextTick()
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ imageKey: '/carousel/robux-promo.png' })
  })

  it('disables carousel uploads while carousel save is running', async () => {
    const wrapper = await mountSuspended(SlideForm, { props: { products, saving: true } })

    expect(wrapper.findComponent(AdminImageUpload).props('disabled')).toBe(true)
  })

  it('keeps manually entered image key as fallback after upload failure', async () => {
    const wrapper = await mountSuspended(SlideForm, { props: { products, saving: false } })

    await wrapper.find('input[aria-label="Clave de imagen del carrusel"]').setValue('carousel/manual-promo.png')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ imageKey: 'carousel/manual-promo.png' })
  })
})
