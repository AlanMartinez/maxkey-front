import type { NuxtApp } from '#app'
import type { AsyncDataRefreshCause } from '#app/composables/asyncData'

// Client-only: on the server this module outlives a single request, so timestamps are never recorded there.
const fetchedAt = new Map<string, number>()

/**
 * Reuses `useAsyncData` results for `ttlMs` on client navigation instead of refetching on every visit.
 * Manual `refresh()` always bypasses the cache; expired or errored entries fall through to a new fetch.
 */
export function ttlCache<T>(key: string, ttlMs: number, handler: () => Promise<T>) {
  return {
    handler: async (): Promise<T> => {
      const data = await handler()
      if (import.meta.client) fetchedAt.set(key, Date.now())
      return data
    },
    getCachedData: (cacheKey: string, nuxtApp: NuxtApp, { cause }: { cause: AsyncDataRefreshCause }): T | undefined => {
      const cached = nuxtApp.payload.data[cacheKey] as T | undefined
      if (nuxtApp.isHydrating) {
        // SSR data counts as a fresh fetch from the client's point of view.
        if (cached !== undefined && !fetchedAt.has(cacheKey)) fetchedAt.set(cacheKey, Date.now())
        return cached
      }
      if (cause === 'refresh:manual') return undefined
      const at = fetchedAt.get(cacheKey)
      return at !== undefined && Date.now() - at < ttlMs ? cached : undefined
    },
  }
}

/** Test-only: forget every recorded fetch time. */
export function clearTtlCache() {
  fetchedAt.clear()
}
