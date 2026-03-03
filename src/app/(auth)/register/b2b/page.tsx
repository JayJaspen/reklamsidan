'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SWEDISH_COUNTIES } from '@/lib/utils'
import { Loader2, ChevronLeft } from 'lucide-react'

export default function RegisterB2BPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [form, setForm] = useState({
    companyName: '',
    orgNumber:   '',
    email:       '',
    street:      '',
    postalCode:  '',
    city:        '',
    countyId:    '',
    password:    '',
    confirmPw:   '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPw) { setError('Lösenorden matchar inte.'); return }
    if (form.password.length < 8)         { setError('Lösenordet måste vara minst 8 tecken.'); return }

    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError || !authData.user) {
      setError(authError?.message === 'User already registered'
        ? 'E-postadressen är redan registrerad.'
        : 'Något gick fel. Försök igen.')
      setLoading(false)
      return
    }

    const userId = authData.user.id

    await supabase.from('user_profiles').insert({ id: userId, user_type: 'b2b' })

    const { error: b2bError } = await supabase.from('users_b2b').insert({
      id:            userId,
      company_name:  form.companyName,
      org_number:    form.orgNumber,
      email:         form.email,
      street_address:form.street,
      postal_code:   form.postalCode,
      city:          form.city,
      county_id:     form.countyId ? parseInt(form.countyId) : null,
    })

    if (b2bError) {
      setError('Företagsuppgifterna kunde inte sparas.')
      setLoading(false)
      return
    }

    router.push('/b2b/favoriter')
  }

  return (
    <div className="p-8">
      <Link href="/register" className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft className="h-4 w-4" /> Tillbaka
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Registrera företag – B2B-mottagare</h1>
      <p className="mb-6 text-sm text-gray-500">
        Registrera ert företag för att ta emot relevant B2B-reklam från leverantörer och partners.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Företagsnamn</label>
          <input type="text" required className="input-field" value={form.companyName}
            onChange={e => set('companyName', e.target.value)} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Organisationsnummer</label>
          <input type="text" required className="input-field" value={form.orgNumber}
            onChange={e => set('orgNumber', e.target.value)} placeholder="556XXX-XXXX" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">E-postadress</label>
          <input type="email" required className="input-field" value={form.email}
            onChange={e => set('email', e.target.value)} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Gatuadress</label>
          <input type="text" className="input-field" value={form.street}
            onChange={e => set('street', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Postnummer</label>
            <input type="text" className="input-field" value={form.postalCode}
              onChange={e => set('postalCode', e.target.value)} placeholder="123 45" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Ort</label>
            <input type="text" className="input-field" value={form.city}
              onChange={e => set('city', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Län</label>
          <select className="input-field" value={form.countyId}
            onChange={e => set('countyId', e.target.value)}>
            <option value="">Välj län...</option>
            {SWEDISH_COUNTIES.map((c, i) => (
              <option key={c} value={String(i + 1)}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Lösenord</label>
          <input type="password" required minLength={8} className="input-field"
            value={form.password} onChange={e => set('password', e.target.value)}
            placeholder="Minst 8 tecken" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Bekräfta lösenord</label>
          <input type="password" required className="input-field"
            value={form.confirmPw} onChange={e => set('confirmPw', e.target.value)} />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Skapar konto...' : 'Skapa konto'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Har du redan ett konto?{' '}
        <Link href="/login" className="font-semibold text-primary-600">Logga in</Link>
      </p>
    </div>
  )
}
