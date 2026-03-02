'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SWEDISH_COUNTIES, isAdult } from '@/lib/utils'
import { Loader2, ChevronLeft } from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()
const MIN_BIRTH_YEAR = CURRENT_YEAR - 100
const MAX_BIRTH_YEAR = CURRENT_YEAR - 18

export default function RegisterB2CPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep]               = useState(1)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [categoriesB2c, setCategoriesB2c] = useState<{ id: number; name: string; parent_id: number | null }[]>([])

  const [form, setForm] = useState({
    firstName:    '',
    lastName:     '',
    email:        '',
    birthYear:    '',
    gender:       '',
    street:       '',
    postalCode:   '',
    city:         '',
    countyId:     '',
    categories:   [] as number[],
    password:     '',
    confirmPw:    '',
  })

  useEffect(() => {
    supabase.from('categories_b2c').select('id,name,parent_id').eq('is_active', true).order('sort_order')
      .then(({ data }) => { if (data) setCategoriesB2c(data) })
  }, [])

  const mainCats = categoriesB2c.filter(c => c.parent_id === null)
  const subCats  = (parentId: number) => categoriesB2c.filter(c => c.parent_id === parentId)

  function toggleCategory(id: number) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(id)
        ? f.categories.filter(c => c !== id)
        : [...f.categories, id],
    }))
  }

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPw) { setError('Lösenorden matchar inte.'); return }
    if (form.password.length < 8)         { setError('Lösenordet måste vara minst 8 tecken.'); return }
    if (!isAdult(parseInt(form.birthYear))) { setError('Du måste vara minst 18 år för att registrera dig.'); return }

    setLoading(true)

    // 1. Skapa auth-användare
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

    // 2. Spara user_profiles
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: userId,
      user_type: 'b2c',
    })
    if (profileError) { setError('Profilen kunde inte skapas.'); setLoading(false); return }

    // 3. Spara B2C-uppgifter
    const { error: b2cError } = await supabase.from('users_b2c').insert({
      id:            userId,
      first_name:    form.firstName,
      last_name:     form.lastName,
      email:         form.email,
      birth_year:    parseInt(form.birthYear),
      gender:        form.gender,
      street_address:form.street,
      postal_code:   form.postalCode,
      city:          form.city,
      county_id:     form.countyId ? parseInt(form.countyId) : null,
    })
    if (b2cError) { setError('Användaruppgifterna kunde inte sparas.'); setLoading(false); return }

    // 4. Spara kategorier
    if (form.categories.length > 0) {
      await supabase.from('users_b2c_categories').insert(
        form.categories.map(catId => ({ user_id: userId, category_id: catId }))
      )
    }

    router.push('/b2c/favoriter')
  }

  return (
    <div className="p-8">
      <Link href="/register" className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft className="h-4 w-4" /> Tillbaka
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Registrera som privatperson</h1>
      <p className="mb-6 text-sm text-gray-500">Steg {step} av 2</p>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 w-full rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full bg-primary-600 transition-all"
          style={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Förnamn</label>
                <input type="text" required className="input-field" value={form.firstName}
                  onChange={e => set('firstName', e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Efternamn</label>
                <input type="text" required className="input-field" value={form.lastName}
                  onChange={e => set('lastName', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">E-postadress</label>
              <input type="email" required className="input-field" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Födelseår</label>
                <input type="number" required min={MIN_BIRTH_YEAR} max={MAX_BIRTH_YEAR}
                  className="input-field" value={form.birthYear}
                  onChange={e => set('birthYear', e.target.value)}
                  placeholder={String(CURRENT_YEAR - 30)} />
                <p className="mt-1 text-xs text-gray-400">Du måste vara minst 18 år</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Kön</label>
                <select required className="input-field" value={form.gender}
                  onChange={e => set('gender', e.target.value)}>
                  <option value="">Välj...</option>
                  <option value="man">Man</option>
                  <option value="kvinna">Kvinna</option>
                  <option value="annat">Annat</option>
                </select>
              </div>
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
                {SWEDISH_COUNTIES.map(c => (
                  <option key={c} value={c}>{c}</option>
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

            <button type="button" onClick={() => setStep(2)} className="btn-primary w-full py-3">
              Nästa steg – välj intressen →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">
              Välj de kategorier du är intresserad av. Reklam inom dessa kategorier visas under fliken <strong>Intressereklam</strong>.
            </p>

            <div className="max-h-80 overflow-y-auto space-y-4 rounded-xl border border-gray-200 p-4">
              {mainCats.map(main => (
                <div key={main.id}>
                  <p className="mb-2 text-sm font-semibold text-gray-700">{main.name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {subCats(main.id).map(sub => (
                      <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.categories.includes(sub.id)}
                          onChange={() => toggleCategory(sub.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-600">{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
                ← Tillbaka
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Skapar konto...' : 'Skapa konto'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
