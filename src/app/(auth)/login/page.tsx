'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

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

    // Hämta user_type för omdirigering
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', data.user.id)
      .single()

    const dashMap: Record<string, string> = {
      admin:   '/admin/anvandare',
      b2c:     '/b2c/favoriter',
      b2b:     '/b2b/favoriter',
      company: '/foretag/statistik',
    }

    const redirect = searchParams.get('redirect')
    const dest = redirect || dashMap[profile?.user_type ?? 'b2c'] || '/'
    router.push(dest)
    router.refresh()
  }

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Välkommen tillbaka</h1>
      <p className="mb-6 text-sm text-gray-500">Logga in på ditt konto</p>

      {searchParams.get('error') && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Något gick fel. Försök igen.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            E-postadress
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-field"
            placeholder="din@epost.se"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Lösenord
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Loggar in...' : 'Logga in'}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
        Har du inget konto?{' '}
        <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
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
