'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

// Sätter en cookie som middleware kontrollerar för att tvinga utloggning
function setSessionExpiry(rememberMe: boolean) {
  const MS = rememberMe
    ? 30 * 24 * 60 * 60 * 1000   // 30 dagar
    : 5  * 60 * 60 * 1000         // 5 timmar
  const expiresAt  = Date.now() + MS
  const maxAgeSec  = Math.floor(MS / 1000)
  const expiresUTC = new Date(expiresAt).toUTCString()
  document.cookie =
    `session_expires_at=${expiresAt}; path=/; max-age=${maxAgeSec}; expires=${expiresUTC}; SameSite=Lax`
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const sessionExpired = searchParams.get('expired') === '1'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError('Felaktig e-postadress eller lösenord.')
      setLoading(false)
      return
    }

    // Sätt sessionstimer baserat på "Håll mig inloggad"-valet
    setSessionExpiry(rememberMe)

    // Hämta user_type för omdirigering
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', data.user.id)
      .single()

    const dashMap: Record<string, string> = {
      admin:   '/admin/anvandare',
      b2c:     '/b2c/favoritreklam',
      b2b:     '/b2b/favoritreklam',
      company: '/foretag/statistik',
    }

    const redirect = searchParams.get('redirect')
    const dest = redirect || dashMap[profile?.user_type ?? 'b2c'] || '/'
    router.push(dest)
    router.refresh()
  }

  return (
    <div className="p-8 sm:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Välkommen tillbaka</h1>
        <p className="mt-1 text-sm text-gray-500">Logga in på ditt konto för att fortsätta</p>
      </div>

      {searchParams.get('error') && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          Något gick fel. Försök igen.
        </div>
      )}

      {sessionExpired && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
          Din session har gått ut. Logga in igen för att fortsätta.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">E-postadress</label>
          <input
            type="email" required autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)}
            className="input-field" placeholder="din@epost.se"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Lösenord</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="input-field pr-10" placeholder="••••••••"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-1.5 flex justify-end">
            <Link href="/glomt-losenord" className="text-xs text-primary-600 hover:text-primary-700 transition-colors">
              Glömt lösenord?
            </Link>
          </div>
        </div>

        {/* Håll mig inloggad */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600">
            Håll mig inloggad i <span className="font-medium text-gray-800">30 dagar</span>
          </span>
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Loggar in...' : 'Logga in'}
        </button>
      </form>

      <div className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
        Har du inget konto?{' '}
        <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          Registrera dig här
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Laddar...</div>}>
      <LoginForm />
    </Suspense>
  )
}
