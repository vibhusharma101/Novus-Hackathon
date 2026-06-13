import { supabaseAdmin } from '@/lib/supabase'

/**
 * Shared per-user rate limit for the paid LLM endpoints. Backed by an atomic
 * Postgres fixed-window counter (server-only, via the service role) so it holds
 * across serverless instances — unlike an in-memory limiter.
 *
 * Fails OPEN on infra error (e.g. the migration hasn't been applied yet): the
 * limiter is best-effort hardening and must never take the app down. Errors are
 * not attacker-controllable, so fail-open does not create a bypass.
 *
 * @returns true if the request is allowed, false if the limit is exceeded.
 */
export async function checkRateLimit(
  userId: string,
  limit = 30,
  windowSeconds = 60,
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc('check_ai_rate_limit', {
      p_user: userId,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) return true
    return data === true
  } catch {
    return true
  }
}
