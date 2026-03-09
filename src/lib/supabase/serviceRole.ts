import { createClient } from '@supabase/supabase-js'

/**
 * Supabase-klient med service role key.
 * Kringgår RLS – använd ENBART i server-side-kod (API-routes, Server Actions)
 * och aldrig för operationer som ska vara användaravgränsade.
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
