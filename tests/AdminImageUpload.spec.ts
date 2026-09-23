import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import AdminImageUpload from '~/components/admin/AdminImageUpload.vue'

const { upload, api } = vi.hoisted(() => ({ upload: vi.fn(), api: vi.fn() }))

vi.mock('@imagekit/vue', () => ({ upload }))

mockNuxtImport('useApi', () => () => api)
vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

describe('AdminImageUpload', () => {
  beforeEach(() => {
    api.mockReset()
    upload.mockReset()
  })

  it('rejects a file larger than 20 MB before requesting upload credentials', async () => {
    const wrapper = await mountSuspended(AdminImageUpload, { props: { folder: '/products' } })
    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })

    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')

    expect(wrapper.text()).toContain('La imagen supera el máximo de 20 MB.')
    expect(api).not.toHaveBeenCalled()
    expect(upload).not.toHaveBeenCalled()
  })

  it('only stages accepted image locally until parent explicitly uploads it', async () => {
    api.mockResolvedValue({ token: 'token', signature: 'signature', expire: 1790100000, publicKey: 'public_key' })
    upload.mockImplementation(async (options: { onProgress?: (event: { loaded: number; total: number }) => void }) => {
      options.onProgress?.({ loaded: 1, total: 1 })
      return { filePath: '/products/robux.png', url: 'https://ik.imagekit.io/test-account/products/robux.png' }
    })
    const wrapper = await mountSuspended(AdminImageUpload, { props: { folder: '/products' } })
    const file = new File(['image'], 'robux.png', { type: 'image/png' })

    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await flushPromises()

    expect(api).not.toHaveBeenCalled()
    expect(upload).not.toHaveBeenCalled()
    expect(wrapper.emitted('preview')?.[0]).toEqual([['blob:preview']])
  })

  it('uploads staged image only when uploadSelected is called', async () => {
    api.mockResolvedValue({ token: 'token', signature: 'signature', expire: 1790100000, publicKey: 'public_key' })
    upload.mockResolvedValue({ filePath: '/products/robux.png', url: 'https://ik.imagekit.io/test-account/products/robux.png' })
    const wrapper = await mountSuspended(AdminImageUpload, { props: { folder: '/products' } })
    const file = new File(['image'], 'robux.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')

    const uploadedPaths = await wrapper.vm.uploadSelected()

    expect(api).toHaveBeenCalledWith('/admin/media/imagekit-auth', { method: 'GET' })
    expect(upload).toHaveBeenCalledWith(expect.objectContaining({ file, folder: '/products' }))
    expect(api).toHaveBeenNthCalledWith(2, '/admin/media/imagekit-assets', {
      method: 'POST',
      body: { filePath: 'products/robux.png' },
    })
    expect(uploadedPaths).toEqual(['products/robux.png'])
    expect(wrapper.emitted('uploaded')).toEqual([['products/robux.png', 'https://ik.imagekit.io/test-account/products/robux.png']])
  })

  it('uploads immediately on selection when autoUpload is set, without waiting for a manual uploadSelected call', async () => {
    api.mockResolvedValue({ token: 'token', signature: 'signature', expire: 1790100000, publicKey: 'public_key' })
    upload.mockResolvedValue({ filePath: '/guides/step-1.png', url: 'https://ik.imagekit.io/test-account/guides/step-1.png' })
    const wrapper = await mountSuspended(AdminImageUpload, { props: { folder: '/guides', autoUpload: true } })
    const file = new File(['image'], 'step-1.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })

    await input.trigger('change')
    await flushPromises()

    expect(upload).toHaveBeenCalledWith(expect.objectContaining({ file, folder: '/guides' }))
    expect(wrapper.emitted('uploaded')).toEqual([['guides/step-1.png', 'https://ik.imagekit.io/test-account/guides/step-1.png']])
  })

  it('does not return or emit a path when ImageKit asset registration fails', async () => {
    api.mockResolvedValueOnce({ token: 'token', signature: 'signature', expire: 1790100000, publicKey: 'public_key' })
    api.mockRejectedValueOnce(new Error('registration unavailable'))
    upload.mockResolvedValue({ filePath: '/products/robux.png' })
    const wrapper = await mountSuspended(AdminImageUpload, { props: { folder: '/products' } })
    const file = new File(['image'], 'robux.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')

    await expect(wrapper.vm.uploadSelected()).rejects.toThrow('No se pudo registrar la imagen subida.')

    expect(api).toHaveBeenNthCalledWith(1, '/admin/media/imagekit-auth', { method: 'GET' })
    expect(api).toHaveBeenNthCalledWith(2, '/admin/media/imagekit-assets', {
      method: 'POST',
      body: { filePath: 'products/robux.png' },
    })
    expect(wrapper.emitted('uploaded')).toBeUndefined()
  })

  it('uses thumbnail-sized previews and compact picker control', async () => {
    const wrapper = await mountSuspended(AdminImageUpload, { props: { folder: '/products' } })

    expect(wrapper.find('[data-testid="image-upload-dropzone"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="image-upload-picker"]').text()).toContain('Subir imagen')
    expect(wrapper.find('[data-testid="image-upload-picker"]').classes()).toContain('h-20')
  })

  it('stages only first dropped image when multiple is disabled', async () => {
    api.mockResolvedValue({ token: 'token', signature: 'signature', expire: 1790100000, publicKey: 'public_key' })
    upload.mockResolvedValue({ filePath: '/products/first.png' })
    const wrapper = await mountSuspended(AdminImageUpload, { props: { folder: '/products' } })
    const first = new File(['first'], 'first.png', { type: 'image/png' })
    const second = new File(['second'], 'second.png', { type: 'image/png' })

    await wrapper.find('[data-testid="image-upload-picker"]').trigger('drop', { dataTransfer: { files: [first, second] } })
    await flushPromises()

    expect(upload).not.toHaveBeenCalled()
    expect(api).not.toHaveBeenCalled()
  })

  it('shows a safe error when ImageKit response has no filePath after upload is requested', async () => {
    api.mockResolvedValue({ token: 'token', signature: 'signature', expire: 1790100000, publicKey: 'public_key' })
    upload.mockResolvedValue({})
    const wrapper = await mountSuspended(AdminImageUpload, { props: { folder: '/products' } })
    const file = new File(['image'], 'robux.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })

    await input.trigger('change')
    await expect(wrapper.vm.uploadSelected()).rejects.toThrow('No se pudo obtener la ruta de la imagen subida.')
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo obtener la ruta de la imagen subida.')
    expect(wrapper.emitted('uploaded')).toBeUndefined()
  })

  it('does not accept picker or drop uploads while disabled and communicates disabled controls', async () => {
    const wrapper = await mountSuspended(AdminImageUpload, { props: { folder: '/products', disabled: true } })
    const file = new File(['image'], 'robux.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })

    await input.trigger('change')
    await wrapper.find('[data-testid="image-upload-picker"]').trigger('drop', { dataTransfer: { files: [file] } })
    await flushPromises()

    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="image-upload-picker"]').attributes('aria-disabled')).toBe('true')
    expect(api).not.toHaveBeenCalled()
    expect(upload).not.toHaveBeenCalled()
  })
})
