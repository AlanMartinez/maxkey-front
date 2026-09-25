import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NuxtApp } from '#app'
import { clearTtlCache, ttlCache } from '~/utils/ttlCache'

const KEY = 'product-riot-points'
const TTL = 60_000

function fakeApp(data: unknown, isHydrating = false) {
  return { isHydrating, payload: { data: { [KEY]: data } } } as unknown as NuxtApp
}

describe('ttlCache', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    clearTtlCache()
  })

  it('reuses the payload within the TTL after a fetch', async () => {
    const cache = ttlCache(KEY, TTL, async () => 'detail')
    await cache.handler()
    vi.advanceTimersByTime(TTL - 1)

    expect(cache.getCachedData(KEY, fakeApp('detail'), { cause: 'initial' })).toBe('detail')
  })

  it('refetches once the TTL expires', async () => {
    const cache = ttlCache(KEY, TTL, async () => 'detail')
    await cache.handler()
    vi.advanceTimersByTime(TTL)

    expect(cache.getCachedData(KEY, fakeApp('detail'), { cause: 'initial' })).toBeUndefined()
  })

  it('refetches without a recorded fetch', () => {
    const cache = ttlCache(KEY, TTL, async () => 'detail')

    expect(cache.getCachedData(KEY, fakeApp('detail'), { cause: 'initial' })).toBeUndefined()
  })

  it('bypasses the cache on manual refresh', async () => {
    const cache = ttlCache(KEY, TTL, async () => 'detail')
    await cache.handler()

    expect(cache.getCachedData(KEY, fakeApp('detail'), { cause: 'refresh:manual' })).toBeUndefined()
  })

  it('serves SSR data while hydrating and starts the TTL from there', () => {
    const cache = ttlCache(KEY, TTL, async () => 'detail')

    expect(cache.getCachedData(KEY, fakeApp('detail', true), { cause: 'initial' })).toBe('detail')
    expect(cache.getCachedData(KEY, fakeApp('detail'), { cause: 'initial' })).toBe('detail')
  })
})
