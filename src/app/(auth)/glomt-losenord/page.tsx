'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'

export default function GlomtLosenordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/aterstall-losenord`,
    })

    if (resetError) {
      setError('Något gick fel. Kontrollera e-postadressen och försök igen.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="p-8 sm:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Glömt lösenord?</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
        </p>
      </div>

      {sent ? (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-green-50 px-6 py-8 text-center ring-1 ring-green-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-semibold text-green-800">E-post skickad!</p>
            <p className="text-sm text-green-700">
              Om <span className="font-medium">{email}</span> är registrerat hos oss har vi skickat
              en länk för att återställa ditt lösenord. Kolla gärna skräpposten om du inte ser mejlet.
            </p>
          </div>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till inloggning
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">E-postadress</label>
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

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Skickar...' : 'Skicka återställningslänk'}
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till inloggning
          </Link>
        </form>
      )}
    </div>
  )
}
