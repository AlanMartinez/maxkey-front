import type { ProblemDetails } from '~/types/api'

/**
 * Hard cap on any backend request. Without it a hung request (backend stalled, Fly machine waking up
 * slowly, dropped TCP connection) never settles and every button spinner tied to it runs forever.
 */
export const API_TIMEOUT_MS = 20_000

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

  /** Human-readable Spanish copy for known statuses — falls back to the server's own title/detail. */
  friendlyMessage(): string {
    switch (this.status) {
      case 404:
        return 'Pedido no encontrado.'
      case 409:
        return this.detail ?? this.title ?? 'La acción no es válida en el estado actual del pedido.'
      case 401:
      case 403:
        return 'No tenés permisos para esta acción.'
      case 408:
        return 'El servidor tardó demasiado en responder. Reintentá.'
      case 0:
        return 'No se pudo conectar con el servidor.'
      default:
        return this.detail ?? this.title ?? 'Ocurrió un error inesperado.'
    }
  }
}

/**
 * Maps a request-level failure (fetch itself threw — no HTTP response) to Problem Details. ofetch
 * fires its `timeout` by aborting the request with an error named `TimeoutError` (a caller-supplied
 * `AbortSignal.timeout()` rejects with the same name; a plain abort with `AbortError`); anything
 * else is a network/CORS failure, which keeps the existing `status: 0` convention.
 */
function requestErrorToProblemDetails(error: unknown): ProblemDetails {
  const name = error instanceof Error ? error.name : ''
  if (name === 'TimeoutError' || name === 'AbortError') {
    return { type: 'about:blank', title: 'Request timed out', status: 408 }
  }
  return { type: 'about:blank', title: 'Network error', status: 0 }
}

/**
 * True only when no HTTP response came back at all (connection refused, DNS, offline). The dev-only
 * mock fallbacks in the admin composables key off this so a real 4xx/5xx from a running backend still
 * surfaces as an error instead of being painted over with mock success.
 */
export function isBackendUnreachable(e: unknown): boolean {
  return e instanceof ApiError && e.status === 0
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
    timeout: API_TIMEOUT_MS,
    async onRequest({ options }) {
      const sessionToken = accessToken ?? (await supabase.auth.getSession()).data.session?.access_token
      // DEV-ONLY: falls back to a minted admin JWT (see nuxt.config.ts) when there's no real Supabase
      // session locally — `import.meta.dev` is compile-time-false (dead-code-eliminated) in production.
      const token = sessionToken ?? (import.meta.dev ? config.public.devAdminToken || undefined : undefined)
      if (token) options.headers.set('Authorization', `Bearer ${token}`)
    },
    // Timeouts and network failures never reach `onResponseError` (there is no response). Throwing
    // here rejects the call straight away with an ApiError, which also skips ofetch's built-in
    // GET retry — one that would otherwise re-run an already-aborted request against a stalled backend.
    onRequestError({ error }) {
      throw new ApiError(requestErrorToProblemDetails(error))
    },
    onResponseError({ response }) {
      throw new ApiError(toProblemDetails(response.status, response.statusText, response._data))
    },
  })
}
