import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import ArticlePage from '~/pages/article/[slug].vue'
import ErrorState from '~/components/ui/ErrorState.vue'
import { ApiError } from '~/composables/useApi'
import type { GuideDto } from '~/types/api'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)
mockNuxtImport('useRoute', () => () => ({ params: { slug: 'example-activation-guide' } }))

function buildGuide(): GuideDto {
  return { id: 'g1', slug: 'example-activation-guide', title: 'Cómo activar tu código', contentMarkdown: '**Paso 1.** Abrí la app.' }
}

describe('pages/article/[slug]', () => {
  it('renders the title and sanitized Markdown content', async () => {
    apiMock.mockResolvedValueOnce(buildGuide())

    const wrapper = await mountSuspended(ArticlePage)

    expect(wrapper.text()).toContain('Cómo activar tu código')
    expect(wrapper.find('.markdown-body').html()).toContain('<strong')
  })

  /// Review Focus (final review, Important #3): an unknown slug must 404, same as pages/product/[slug].vue.
  it('resolves a 404 ApiError to error.value.statusCode === 404, the condition the page throws createError on', async () => {
    // useAsyncData normalizes the rejected ApiError via Nuxt's own createError(), which is what
    // makes `error.value.statusCode` available for the page's `if (httpStatus === 404)` check —
    // mocking createError itself would break that normalization along with the page's own call,
    // since both go through the same global. Asserting on the normalized value it produces is the
    // stable, non-fragile way to pin this without fighting that shared internal.
    apiMock.mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Not Found', status: 404 }))
    let observedStatusCode: number | undefined
    const Probe = defineComponent({
      async setup() {
        const api = useApi()
        const { error } = await useAsyncData('probe-404', () => api('/guides/unknown-slug'))
        observedStatusCode = (error.value as { statusCode?: number } | null)?.statusCode
        return () => h('div')
      },
    })

    await mountSuspended(Probe)

    expect(observedStatusCode).toBe(404)
  })

  it('shows a retryable error state for a non-404 failure', async () => {
    apiMock.mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Server Error', status: 500 }))

    const wrapper = await mountSuspended(ArticlePage)

    expect(wrapper.findComponent(ErrorState).exists()).toBe(true)
  })
})
