'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SWEDISH_COUNTIES } from '@/lib/utils'
import { Loader2, ChevronLeft, Copy } from 'lucide-react'
// Allabolag.se-integration borttagen – uppgifter fylls i manuellt

const STEPS = ['Företagsuppgifter', 'Kategorier & Län', 'Fakturering']

export default function RegisterForetagPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const [cats_b2c, setCatsB2c] = useState<{ id: number; name: string; parent_id: number | null }[]>([])
  const [cats_b2b, setCatsB2b] = useState<{ id: number; name: string; parent_id: number | null }[]>([])

  const [form, setForm] = useState({
    orgNumber:       '',
    registeredName:  '',
    publicName:      '',
    logoFile:        null as File | null,
    contactPerson:   '',
    contactEmail:    '',
    contactPhone:    '',
    website:         '',
    description:     '',
    counties:        [] as string[],
    categoriesB2c:   [] as number[],
    sendsB2b:        false,
    categoriesB2b:   [] as number[],
    billingMethod:   '' as 'address' | 'email' | '',
    billingAddress:  '',
    billingPostalCode:'',
    billingCity:     '',
    billingReference:'',
    billingEmail:    '',
    billingEmailRef: '',
    email:           '',
    password:        '',
    confirmPw:       '',
  })

  useEffect(() => {
    supabase.from('categories_b2c').select('id,name,parent_id').eq('is_active',true).order('sort_order')
      .then(({ data }) => { if (data) setCatsB2c(data) })
    supabase.from('categories_b2b').select('id,name,parent_id').eq('is_active',true).order('sort_order')
      .then(({ data }) => { if (data) setCatsB2b(data) })
  }, [])

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleCounty(county: string) {
    setForm(f => ({
      ...f,
      counties: f.counties.includes(county)
        ? f.counties.filter(c => c !== county)
        : [...f.counties, county],
    }))
  }

  function toggleCatB2c(id: number) {
    setForm(f => ({
      ...f,
      categoriesB2c: f.categoriesB2c.includes(id)
        ? f.categoriesB2c.filter(c => c !== id)
        : [...f.categoriesB2c, id],
    }))
  }

  function toggleCatB2b(id: number) {
    setForm(f => ({
      ...f,
      categoriesB2b: f.categoriesB2b.includes(id)
        ? f.categoriesB2b.filter(c => c !== id)
        : [...f.categoriesB2b, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPw) { setError('Lösenorden matchar inte.'); return }
    if (form.password.length < 8)         { setError('Lösenordet måste vara minst 8 tecken.'); return }

    setLoading(true)

    // 1. Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authError || !authData.user) {
      setError(authError?.message === 'User already registered' ? 'E-postadressen är redan registrerad.' : 'Något gick fel.')
      setLoading(false)
      return
    }
    const userId = authData.user.id

    // 2. Ladda upp logotyp (om vald)
    let logoUrl = ''
    if (form.logoFile) {
      const ext = form.logoFile.name.split('.').pop()
      const path = `logos/${userId}.${ext}`
      const { error: uploadError } = await supabase.storage.from('company-assets').upload(path, form.logoFile, { upsert: true })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('company-assets').getPublicUrl(path)
        logoUrl = publicUrl
      }
    }

    // 3. user_profiles
    await supabase.from('user_profiles').insert({ id: userId, user_type: 'company' })

    // 4. companies
    const { error: companyError } = await supabase.from('companies').insert({
      id:                     userId,
      org_number:             form.orgNumber,
      registered_name:        form.registeredName,
      public_name:            form.publicName,
      logo_url:               logoUrl || null,
      contact_person:         form.contactPerson,
      contact_email:          form.contactEmail,
      contact_phone:          form.contactPhone,
      website:                form.website,
      company_description:    form.description,
      sends_b2b:              form.sendsB2b,
      billing_method:         form.billingMethod || null,
      billing_address:        form.billingMethod === 'address' ? form.billingAddress : null,
      billing_postal_code:    form.billingMethod === 'address' ? form.billingPostalCode : null,
      billing_city:           form.billingMethod === 'address' ? form.billingCity : null,
      billing_reference:      form.billingMethod === 'address' ? form.billingReference : null,
      billing_email:          form.billingMethod === 'email' ? form.billingEmail : null,
      billing_email_reference:form.billingMethod === 'email' ? form.billingEmailRef : null,
    })
    if (companyError) { setError('Företagsuppgifterna kunde inte sparas.'); setLoading(false); return }

    // 5. Länkoppla kategorier och län (via county names -> IDs)
    if (form.categoriesB2c.length > 0) {
      await supabase.from('company_categories_b2c').insert(
        form.categoriesB2c.map(id => ({ company_id: userId, category_id: id }))
      )
    }
    if (form.sendsB2b && form.categoriesB2b.length > 0) {
      await supabase.from('company_categories_b2b').insert(
        form.categoriesB2b.map(id => ({ company_id: userId, category_id: id }))
      )
    }

    router.push('/foretag/statistik')
  }

  const mainCatsB2c = cats_b2c.filter(c => c.parent_id === null)
  const subCatsB2c  = (pid: number) => cats_b2c.filter(c => c.parent_id === pid)
  const mainCatsB2b = cats_b2b.filter(c => c.parent_id === null)
  const subCatsB2b  = (pid: number) => cats_b2b.filter(c => c.parent_id === pid)

  return (
    <div className="p-8">
      <Link href="/register" className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft className="h-4 w-4" /> Tillbaka
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Registrera annonsörföretag</h1>

      {/* Steps */}
      <div className="mb-6 flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 rounded-full h-1.5 ${i + 1 <= step ? 'bg-primary-600' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="mb-6 text-sm font-medium text-gray-500">
        Steg {step} av {STEPS.length}: {STEPS[step - 1]}
      </p>

      <form onSubmit={handleSubmit}>
        {/* STEG 1: Företagsuppgifter */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Organisationsnummer</label>
              <input type="text" required className="input-field" value={form.orgNumber}
                onChange={e => set('orgNumber', e.target.value)} placeholder="556XXX-XXXX" />
              <p className="mt-1 text-xs text-gray-400">Synligt endast för admin</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Registrerat företagsnamn</label>
              <input type="text" required className="input-field" value={form.registeredName}
                onChange={e => set('registeredName', e.target.value)} />
              <p className="mt-1 text-xs text-gray-400">Synligt endast för admin</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Publikt företagsnamn</label>
              <div className="flex gap-2">
                <input type="text" required className="input-field" value={form.publicName}
                  onChange={e => set('publicName', e.target.value)}
                  placeholder="Synligt för alla användare" />
                <button type="button"
                  onClick={() => set('publicName', form.registeredName)}
                  disabled={!form.registeredName}
                  title="Kopiera från registrerat namn"
                  className="btn-secondary px-3">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Logotyp (JPG, PNG)</label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf"
                onChange={e => set('logoFile', e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Kontaktperson</label>
                <input type="text" required className="input-field" value={form.contactPerson}
                  onChange={e => set('contactPerson', e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">E-post kontaktperson</label>
                <input type="email" required className="input-field" value={form.contactEmail}
                  onChange={e => set('contactEmail', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Telefon kontaktperson</label>
                <input type="tel" className="input-field" value={form.contactPhone}
                  onChange={e => set('contactPhone', e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Hemsida</label>
                <input type="url" className="input-field" value={form.website}
                  onChange={e => set('website', e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Företagspresentation</label>
              <textarea rows={3} className="input-field resize-none" value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Berätta kort om er verksamhet..." />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Inloggnings-e-post</label>
              <input type="email" required className="input-field" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Lösenord</label>
                <input type="password" required minLength={8} className="input-field"
                  value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Bekräfta lösenord</label>
                <input type="password" required className="input-field"
                  value={form.confirmPw} onChange={e => set('confirmPw', e.target.value)} />
              </div>
            </div>

            <button type="button" onClick={() => setStep(2)} className="btn-primary w-full py-3">
              Nästa →
            </button>
          </div>
        )}

        {/* STEG 2: Kategorier & Län */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Hemmahörande län */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Hemmahörande län <span className="font-normal text-gray-400">(välj ett eller flera)</span>
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 p-3 max-h-48 overflow-y-auto">
                {SWEDISH_COUNTIES.map(c => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.counties.includes(c)}
                      onChange={() => toggleCounty(c)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                    <span className="text-sm text-gray-600">{c}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* B2C kategorier */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Kategorier B2C <span className="font-normal text-gray-400">(reklam till privatpersoner)</span>
              </label>
              <div className="max-h-60 overflow-y-auto space-y-3 rounded-xl border border-gray-200 p-3">
                {mainCatsB2c.map(main => (
                  <div key={main.id}>
                    <p className="mb-1.5 text-xs font-bold uppercase text-gray-400">{main.name}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {subCatsB2c(main.id).map(sub => (
                        <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.categoriesB2c.includes(sub.id)}
                            onChange={() => toggleCatB2c(sub.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                          <span className="text-sm text-gray-600">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* B2B */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input type="checkbox" checked={form.sendsB2b}
                  onChange={e => set('sendsB2b', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600" />
                <span className="text-sm font-semibold text-gray-700">Skickar ni även B2B-reklam?</span>
              </label>

              {form.sendsB2b && (
                <div className="max-h-60 overflow-y-auto space-y-3 rounded-xl border border-primary-200 bg-primary-50/30 p-3">
                  <p className="text-xs text-primary-600 font-medium">Välj B2B-kategorier:</p>
                  {mainCatsB2b.map(main => (
                    <div key={main.id}>
                      <p className="mb-1.5 text-xs font-bold uppercase text-gray-400">{main.name}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {subCatsB2b(main.id).map(sub => (
                          <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.categoriesB2b.includes(sub.id)}
                              onChange={() => toggleCatB2b(sub.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                            <span className="text-sm text-gray-600">{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Tillbaka</button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1 py-3">Nästa →</button>
            </div>
          </div>
        )}

        {/* STEG 3: Fakturering */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">
              Hur vill ni ta emot fakturor från Reklamsidan?
            </p>

            <div className="space-y-3">
              <label className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${form.billingMethod === 'address' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                <input type="radio" name="billingMethod" value="address"
                  checked={form.billingMethod === 'address'}
                  onChange={() => set('billingMethod', 'address')}
                  className="mt-0.5 h-4 w-4 text-primary-600" />
                <div>
                  <p className="font-semibold text-gray-800">Fysisk adress</p>
                  <p className="text-sm text-gray-500">Vi skickar fakturan per post</p>
                  <p className="mt-1 text-xs text-amber-600 font-medium">⚠ OBS: Det tillkommer en administrativ avgift på 39 kr ex. moms vid postalisk faktura.</p>
                </div>
              </label>

              {form.billingMethod === 'address' && (
                <div className="ml-4 space-y-3 rounded-xl bg-gray-50 p-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Fakturaadress</label>
                    <input type="text" className="input-field" value={form.billingAddress}
                      onChange={e => set('billingAddress', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Postnummer</label>
                      <input type="text" className="input-field" value={form.billingPostalCode}
                        onChange={e => set('billingPostalCode', e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Ort</label>
                      <input type="text" className="input-field" value={form.billingCity}
                        onChange={e => set('billingCity', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Referens (valfritt)</label>
                    <input type="text" className="input-field" value={form.billingReference}
                      onChange={e => set('billingReference', e.target.value)} />
                  </div>
                </div>
              )}

              <label className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${form.billingMethod === 'email' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                <input type="radio" name="billingMethod" value="email"
                  checked={form.billingMethod === 'email'}
                  onChange={() => set('billingMethod', 'email')}
                  className="mt-0.5 h-4 w-4 text-primary-600" />
                <div>
                  <p className="font-semibold text-gray-800">E-post</p>
                  <p className="text-sm text-gray-500">Vi skickar fakturan via e-post (PDF)</p>
                </div>
              </label>

              {form.billingMethod === 'email' && (
                <div className="ml-4 space-y-3 rounded-xl bg-gray-50 p-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">E-postadress för faktura</label>
                    <input type="email" className="input-field" value={form.billingEmail}
                      onChange={e => set('billingEmail', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Referens (valfritt)</label>
                    <input type="text" className="input-field" value={form.billingEmailRef}
                      onChange={e => set('billingEmailRef', e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">← Tillbaka</button>
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
