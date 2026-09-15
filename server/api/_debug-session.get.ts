import { getHeader } from 'h3'
import { serverSupabaseSession, serverSupabaseUser } from '#supabase/server'

// TEMP diagnostic route — remove after debugging the /admin SSR session issue.
function safeError(error: unknown) {
  const e = error as { name?: string; status?: number; code?: string; statusMessage?: string } | undefined
  return { name: e?.name ?? typeof error, status: e?.status, code: e?.code, messageLength: e?.statusMessage?.length ?? 0 }
}

export default defineEventHandler(async (event) => {
  const cookieHeader = getHeader(event, 'cookie') ?? ''
  const cookieNames = cookieHeader.split(';').map((c) => c.trim().split('=')[0]).filter(Boolean)

  const result: Record<string, unknown> = { cookieNames }

  try {
    const session = await serverSupabaseSession(event)
    result.session = session ? { hasAccessToken: !!session.access_token, expiresAt: session.expires_at } : null
  } catch (error) {
    result.sessionError = safeError(error)
  }

  try {
    const user = await serverSupabaseUser(event)
    result.user = user ? { sub: (user as { sub?: string }).sub } : null
  } catch (error) {
    result.userError = safeError(error)
  }

  return result
})
