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

/** Typed `$fetch` bound to the backend: attaches the Supabase bearer and maps errors to `ApiError`. */
export function useApi() {
  const config = useRuntimeConfig()
  const session = useSupabaseSession()

  return $fetch.create({
    baseURL: config.public.apiBaseUrl,
    onRequest({ options }) {
      const token = session.value?.access_token
      if (token) options.headers.set('Authorization', `Bearer ${token}`)
    },
    onResponseError({ response }) {
      throw new ApiError(toProblemDetails(response.status, response.statusText, response._data))
    },
  })
}
