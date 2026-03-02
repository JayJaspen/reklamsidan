import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DASHBOARD_MAP: Record<string, string> = {
  admin:   '/admin/anvandare',
  b2c:     '/b2c/favoriter',
  b2b:     '/b2b/favoriter',
  company: '/foretag/statistik',
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect')

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single()

      const userType = profile?.user_type ?? 'b2c'
      const destination = redirect || DASHBOARD_MAP[userType] || '/'
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
