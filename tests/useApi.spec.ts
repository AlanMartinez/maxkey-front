import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFetch } from 'ofetch'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { API_TIMEOUT_MS, ApiError, useApi } from '~/composables/useApi'

type FakeSession = { access_token: string } | null

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }))
mockNuxtImport('useSupabaseClient', () => () => ({ auth: { getSession: getSessionMock } }))

function mockSession(session: FakeSession) {
  getSessionMock.mockResolvedValue({ data: { session } })
}

beforeEach(() => {
  getSessionMock.mockReset()
  mockSession(null)
})

afterEach(() => {
  vi.useRealTimers()
})

function stubFetch(status: number, body: unknown, contentType = 'application/json') {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': contentType } }),
  )
  vi.stubGlobal('$fetch', createFetch({ fetch: fetchMock, Headers }))
  return fetchMock
}

function stubFailingFetch(reason: unknown) {
  const fetchMock = vi.fn<typeof fetch>(async () => {
    throw reason
  })
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
    mockSession({ access_token: 'jwt-123' })
    const fetchMock = stubFetch(200, [])

    await useApi()('/me/orders')

    expect(sentHeaders(fetchMock).get('authorization')).toBe('Bearer jwt-123')
  })

  it('sends no Authorization header without a session and targets apiBaseUrl', async () => {
    mockSession(null)
    const fetchMock = stubFetch(200, [])

    await useApi()('/catalog/products')

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://localhost:8080/catalog/products')
    expect(sentHeaders(fetchMock).has('authorization')).toBe(false)
  })

  it('uses an explicit access token instead of calling getSession() again', async () => {
    mockSession(null)
    const fetchMock = stubFetch(200, [])

    await useApi('jwt-from-caller')('/admin/me')

    expect(sentHeaders(fetchMock).get('authorization')).toBe('Bearer jwt-from-caller')
    expect(getSessionMock).not.toHaveBeenCalled()
  })

  it('aborts a hung request after API_TIMEOUT_MS and rejects with a 408 ApiError', async () => {
    vi.useFakeTimers()
    // Never resolves on its own — only settles when ofetch's timeout aborts the signal it passed in.
    const fetchMock = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
        }),
    )
    vi.stubGlobal('$fetch', createFetch({ fetch: fetchMock, Headers }))

    const pending = useApi()('/admin/buyers').catch((e: unknown) => e)
    await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS)
    const error = (await pending) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(408)
    expect(error.friendlyMessage()).toBe('El servidor tardó demasiado en responder. Reintentá.')
    // No silent retry against a backend that already timed out once.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('maps a TimeoutError thrown by fetch itself to a 408 ApiError', async () => {
    stubFailingFetch(new DOMException('The operation was aborted.', 'TimeoutError'))

    const error = (await useApi()('/admin/buyers').catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(408)
  })

  it('maps a network failure (fetch throws TypeError) to a status 0 ApiError', async () => {
    const fetchMock = stubFailingFetch(new TypeError('Failed to fetch'))

    const error = (await useApi()('/admin/buyers').catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.friendlyMessage()).toBe('No se pudo conectar con el servidor.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('ApiError.friendlyMessage', () => {
  it('maps 404 to a clear "not found" message instead of the raw backend title', () => {
    const error = new ApiError({ type: 'about:blank', title: 'Not Found', status: 404 })
    expect(error.friendlyMessage()).toBe('Pedido no encontrado.')
  })

  it('prefers the backend detail for 409, falling back to the title when there is no detail', () => {
    const withDetail = new ApiError({ type: 'about:blank', title: 'Conflict', status: 409, detail: 'No todas las keys están asignadas todavía.' })
    expect(withDetail.friendlyMessage()).toBe('No todas las keys están asignadas todavía.')

    const withoutDetail = new ApiError({ type: 'about:blank', title: 'Conflict', status: 409 })
    expect(withoutDetail.friendlyMessage()).toBe('Conflict')
  })

  it('maps 401/403 to a permissions message', () => {
    expect(new ApiError({ type: 'about:blank', title: 'Unauthorized', status: 401 }).friendlyMessage()).toBe('No tenés permisos para esta acción.')
    expect(new ApiError({ type: 'about:blank', title: 'Forbidden', status: 403 }).friendlyMessage()).toBe('No tenés permisos para esta acción.')
  })

  it('maps 408 (request timeout) to a retry hint', () => {
    const error = new ApiError({ type: 'about:blank', title: 'Request timed out', status: 408 })
    expect(error.friendlyMessage()).toBe('El servidor tardó demasiado en responder. Reintentá.')
  })

  it('maps the network-failure fallback (status 0) to a connectivity message', () => {
    const error = new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
    expect(error.friendlyMessage()).toBe('No se pudo conectar con el servidor.')
  })

  it('falls back to detail/title for unmapped statuses', () => {
    const error = new ApiError({ type: 'about:blank', title: 'Validation failed', status: 422, detail: 'Buyer email is required' })
    expect(error.friendlyMessage()).toBe('Buyer email is required')
  })
})
