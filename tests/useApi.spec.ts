import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createFetch } from 'ofetch'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ApiError, useApi } from '~/composables/useApi'

const session = ref<{ access_token: string } | null>(null)
mockNuxtImport('useSupabaseSession', () => () => session)

function stubFetch(status: number, body: unknown, contentType = 'application/json') {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': contentType } }),
  )
  vi.stubGlobal('$fetch', createFetch({ fetch: fetchMock, Headers }))
  return fetchMock
}

function sentHeaders(fetchMock: ReturnType<typeof stubFetch>) {
  return new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
}

describe('useApi', () => {
  it('maps a Problem Details body to ApiError', async () => {
    const problem = { type: 'about:blank', title: 'Validation failed', status: 422, detail: 'Buyer email is required', errors: { email: ['required'] } }
    stubFetch(422, problem, 'application/problem+json')

    const error = (await useApi()('/checkout/orders', { method: 'POST', body: {} }).catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.title).toBe('Validation failed')
    expect(error.detail).toBe('Buyer email is required')
    expect(error.problem).toEqual(problem)
  })

  it('falls back to the HTTP status when the body is not Problem Details', async () => {
    stubFetch(500, 'boom')

    const error = (await useApi()('/health').catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(500)
    expect(error.problem.type).toBe('about:blank')
  })

  it('attaches the Supabase bearer token when a session exists', async () => {
    session.value = { access_token: 'jwt-123' }
    const fetchMock = stubFetch(200, [])

    await useApi()('/me/orders')

    expect(sentHeaders(fetchMock).get('authorization')).toBe('Bearer jwt-123')
  })

  it('sends no Authorization header without a session and targets apiBaseUrl', async () => {
    session.value = null
    const fetchMock = stubFetch(200, [])

    await useApi()('/catalog/products')

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://localhost:5000/catalog/products')
    expect(sentHeaders(fetchMock).has('authorization')).toBe(false)
  })
})
