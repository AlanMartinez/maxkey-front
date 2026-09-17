import type { ProblemDetails } from '~/types/api'

/** Error thrown for every non-2xx backend response, carrying the Problem Details body. */
export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly detail?: string
  readonly problem: ProblemDetails

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title)
    this.name = 'ApiError'
    this.status = problem.status
    this.title = problem.title
    this.detail = problem.detail
    this.problem = problem
  }
}

function toProblemDetails(status: number, statusText: string, body: unknown): ProblemDetails {
  const candidate = body as Partial<ProblemDetails> | null
  if (candidate && typeof candidate === 'object' && typeof candidate.title === 'string') {
    return { type: 'about:blank', ...candidate, title: candidate.title, status: candidate.status ?? status }
  }
  return { type: 'about:blank', title: statusText || 'Request failed', status }
}

/**
 * Typed `$fetch` bound to the backend: attaches the Supabase bearer and maps errors to `ApiError`.
 *
 * Pass `accessToken` when the caller already resolved the session (e.g. a middleware that just ran
 * `auth.getSession()` to gate the route) instead of letting this call `getSession()` again — a second,
 * independent call in the same request was observed to intermittently come back without a session even
 * though the first one, moments earlier, succeeded. Without an explicit token, this reads the session
 * fresh from the shared client rather than `useSupabaseSession()`, since that reactive ref can still be
 * null on the first SSR request (see `middleware/admin.ts`).
 */
export function useApi(accessToken?: string) {
  const config = useRuntimeConfig()
  const supabase = useSupabaseClient()

  return $fetch.create({
    baseURL: config.public.apiBaseUrl,
    async onRequest({ options }) {
      const sessionToken = accessToken ?? (await supabase.auth.getSession()).data.session?.access_token
      // DEV-ONLY: falls back to a minted admin JWT (see nuxt.config.ts) when there's no real Supabase
      // session locally — `import.meta.dev` is compile-time-false (dead-code-eliminated) in production.
      const token = sessionToken ?? (import.meta.dev ? config.public.devAdminToken || undefined : undefined)
      if (token) options.headers.set('Authorization', `Bearer ${token}`)
    },
    onResponseError({ response }) {
      throw new ApiError(toProblemDetails(response.status, response.statusText, response._data))
    },
  })
}
