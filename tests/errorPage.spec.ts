import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import ErrorPage from '~/error.vue'
import { WHATSAPP_NUMBER } from '~/utils/contact'

const { clearErrorMock } = vi.hoisted(() => ({ clearErrorMock: vi.fn() }))
mockNuxtImport('clearError', () => clearErrorMock)

// The page shares app.vue's chrome; those components have their own specs and need auth/cart/api state.
const stubs = { AppHeader: true, AppFooter: true, CartDrawer: true, LoginDialog: true, AppToast: true }

beforeEach(() => {
  clearErrorMock.mockClear()
})

describe('error.vue', () => {
  it('renders a branded 404 with a catalog CTA and a WhatsApp help link', async () => {
    const wrapper = await mountSuspended(ErrorPage, { props: { error: { statusCode: 404, statusMessage: 'Page not found', fatal: true } as never }, global: { stubs } })

    expect(wrapper.find('h1').text()).toBe('No encontramos esta página')
    expect(wrapper.text()).toContain('El link puede estar vencido o mal escrito.')
    expect(wrapper.find('a[target="_blank"]').attributes('href')?.startsWith(`https://wa.me/${WHATSAPP_NUMBER}`)).toBe(true)

    await wrapper.find('button').trigger('click')
    expect(clearErrorMock).toHaveBeenCalledWith({ redirect: '/' })
  })

  it('renders a generic message for other errors', async () => {
    const wrapper = await mountSuspended(ErrorPage, { props: { error: { statusCode: 500, statusMessage: 'Server Error', fatal: true } as never }, global: { stubs } })

    expect(wrapper.find('h1').text()).toBe('Algo salió mal')
    expect(wrapper.find('button').text()).toBe('Volver al inicio')
    expect(wrapper.find('a[target="_blank"]').exists()).toBe(false)
  })
})
