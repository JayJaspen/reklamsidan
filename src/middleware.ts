import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type UserType = 'admin' | 'b2c' | 'b2b' | 'company'

function getDashboardPath(userType: UserType): string {
  switch (userType) {
    case 'admin':   return '/admin/anvandare'
    case 'b2c':     return '/b2c/favoritreklam'
    case 'b2b':     return '/b2b/favoritreklam'
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
  // Skydda mot att middleware kraschar Edge-runtime vid oväntat fel
  try {
    return await runMiddleware(request)
  } catch (err) {
    console.error('Middleware error:', err)
    return NextResponse.next()
  }
}

async function runMiddleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
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

  // ── Sessionstimeout-kontroll ───────────────────────────────────
  // Kontrollera om session_expires_at-cookien har gått ut.
  // Cookien sätts vid inloggning: 5h (ej ihågkommen) eller 30d (ihågkommen).
  if (user) {
    const expiresRaw = request.cookies.get('session_expires_at')?.value
    if (expiresRaw) {
      const expiresAt = parseInt(expiresRaw, 10)
      if (!isNaN(expiresAt) && Date.now() > expiresAt) {
        // Session har gått ut – logga ut lokalt
        await supabase.auth.signOut({ scope: 'local' })

        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.search = ''
        loginUrl.searchParams.set('expired', '1')

        // Bygg redirect-svar och kopiera bortrensade auth-cookies
        const expiredResponse = NextResponse.redirect(loginUrl)
        supabaseResponse.cookies.getAll().forEach(c => {
          expiredResponse.cookies.set(c.name, c.value, c as any)
        })
        // Ta bort vår egen utgångna cookie
        expiredResponse.cookies.set('session_expires_at', '', { maxAge: 0, path: '/' })
        return expiredResponse
      }
    }
  }
  // ─────────────────────────────────────────────────────────────

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
}  // end runMiddleware

export const config = {
  matcher: [
    // Exkludera statiska filer, Next.js-interna resurser och worker-filer (.mjs/.js i public)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mjs|ico)$).*)',
  ],
}
