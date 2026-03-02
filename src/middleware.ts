import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type UserType = 'admin' | 'b2c' | 'b2b' | 'company'

function getDashboardPath(userType: UserType): string {
  switch (userType) {
    case 'admin':   return '/admin/anvandare'
    case 'b2c':     return '/b2c/favoriter'
    case 'b2b':     return '/b2b/favoriter'
    case 'company': return '/foretag/statistik'
  }
}

const PROTECTED_PREFIXES: Record<string, UserType> = {
  '/admin':   'admin',
  '/b2c':     'b2c',
  '/b2b':     'b2b',
  '/foretag': 'company',
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Viktigt: hämta user (verifierar session med server)
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Autentiserade sidor – vidarebefordra till login om ej inloggad
  const protectedPrefix = Object.keys(PROTECTED_PREFIXES).find(p =>
    pathname.startsWith(p)
  )

  if (!user) {
    if (protectedPrefix) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Inloggad – hämta user_type
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  const userType = profile?.user_type as UserType | undefined

  // Omdirigera om man försöker gå till fel dashboard
  if (protectedPrefix && userType) {
    const requiredType = PROTECTED_PREFIXES[protectedPrefix]
    if (userType !== requiredType) {
      const url = request.nextUrl.clone()
      url.pathname = getDashboardPath(userType)
      return NextResponse.redirect(url)
    }
  }

  // Inloggad besöker /login eller /register → skicka till rätt dashboard
  if (userType && (pathname === '/login' || pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = getDashboardPath(userType)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
