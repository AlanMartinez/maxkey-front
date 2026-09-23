import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NitroErrorHandler } from 'nitropack/types'
import config from '../nuxt.config'
import productionErrorHandler from '../server/error'

const {
  sendMock,
  sendRedirectMock,
  setResponseHeadersMock,
  setResponseStatusMock,
} = vi.hoisted(() => ({
  sendMock: vi.fn(),
  sendRedirectMock: vi.fn(),
  setResponseHeadersMock: vi.fn(),
  setResponseStatusMock: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => ({
  ...await importOriginal<typeof import('h3')>(),
  send: sendMock,
  sendRedirect: sendRedirectMock,
  setResponseHeaders: setResponseHeadersMock,
  setResponseStatus: setResponseStatusMock,
}))

vi.mock('nitropack/runtime', () => ({
  defineNitroErrorHandler: <T>(handler: T) => handler,
}))

describe('Nitro error handlers', () => {
  beforeEach(() => {
    sendMock.mockClear()
    sendRedirectMock.mockClear()
    setResponseHeadersMock.mockClear()
    setResponseStatusMock.mockClear()
  })

  it('redirects fatal production 404 errors to Chekeys home', async () => {
    const event = {} as never

    await productionErrorHandler({ statusCode: 404, fatal: true } as never, event, {} as never)

    expect(sendRedirectMock).toHaveBeenCalledWith(event, 'https://www.chekeys.com')
  })

  it('redirects fatal development 404 errors to Chekeys home', async () => {
    const event = {} as never
    const handler = config.nitro?.devErrorHandler as NitroErrorHandler

    await handler({ statusCode: 404, fatal: true } as never, event, { defaultHandler: vi.fn() })

    expect(sendRedirectMock).toHaveBeenCalledWith(event, 'https://www.chekeys.com')
  })

  it('uses Nitro development error response for non-404 failures', async () => {
    const event = { node: { res: { headersSent: false } } } as never
    const response = {
      status: 500,
      statusText: 'Server Error',
      headers: { 'content-type': 'application/json' },
      body: { error: true },
    }
    const defaultHandler = vi.fn().mockResolvedValue(response)
    const handler = config.nitro?.devErrorHandler as NitroErrorHandler

    await handler({ statusCode: 500, fatal: true } as never, event, { defaultHandler })

    expect(defaultHandler).toHaveBeenCalled()
    expect(setResponseHeadersMock).toHaveBeenCalledWith(event, response.headers)
    expect(setResponseStatusMock).toHaveBeenCalledWith(event, response.status, response.statusText)
    expect(sendMock).toHaveBeenCalledWith(event, JSON.stringify(response.body, null, 2))
    expect(sendRedirectMock).not.toHaveBeenCalled()
  })
})
