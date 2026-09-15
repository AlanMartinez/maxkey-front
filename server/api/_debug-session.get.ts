import { getHeader } from 'h3'

// TEMP diagnostic route — remove after debugging the /admin SSR session issue.
export default defineEventHandler(async (event) => {
  const cookieHeader = getHeader(event, 'cookie') ?? ''
  const cookieNames = cookieHeader.split(';').map((c) => c.trim().split('=')[0]).filter(Boolean)

  const result: Record<string, unknown> = { cookieNames }

  try {
    const session = await serverSupabaseSession(event)
    result.session = session ? { hasAccessToken: !!session.access_token, expiresAt: session.expires_at } : null
  } catch (error) {
    result.sessionError = error instanceof Error ? error.message : String(error)
  }

  try {
    const user = await serverSupabaseUser(event)
    result.user = user ? { sub: (user as { sub?: string }).sub } : null
  } catch (error) {
    result.userError = error instanceof Error ? error.message : String(error)
  }

  return result
})
