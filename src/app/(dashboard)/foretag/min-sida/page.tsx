'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SWEDISH_COUNTIES } from '@/lib/utils'
import { Loader2, CheckCircle, Upload } from 'lucide-react'

export default function ForetagMinSida() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<{
    b2c: { id: number; name: string; parent_id: number | null }[]
    b2b: { id: number; name: string; parent_id: number | null }[]
  }>({ b2c: [], b2b: [] })

  const [form, setForm] = useState({
    registeredName: '',
    publicName: '',
    logoUrl: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: '',
    counties: [] as string[],
    categoriesB2C: [] as number[],
    sendsB2B: false,
    categoriesB2B: [] as number[],
    billingMethod: 'address' as 'address' | 'email',
    billingAddress: '',
    billingPostal: '',
    billingCity: '',
    billingEmail: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      const [{ data: company }, { data: catsB2C }, { data: catsB2B }, { data: compCatsB2C }, { data: compCatsB2B }] = await Promise.all([
        supabase.from('companies').select('*').eq('id', user.id).single(),
        supabase.from('categories_b2c').select('id,name,parent_id').eq('is_active', true).order('sort_order'),
        supabase.from('categories_b2b').select('id,name,parent_id').eq('is_active', true).order('sort_order'),
        supabase.from('company_categories_b2c').select('category_id').eq('company_id', user.id),
        supabase.from('company_categories_b2b').select('category_id').eq('company_id', user.id),
      ])

      if (company) {
        setForm({
          registeredName: company.registered_name,
          publicName: company.public_name,
          logoUrl: company.logo_url ?? '',
          contactPerson: company.contact_person,
          contactEmail: company.contact_email,
          contactPhone: company.contact_phone,
          website: company.website ?? '',
          description: company.description ?? '',
          counties: company.counties ?? [],
          categoriesB2C: (compCatsB2C ?? []).map(c => c.category_id),
          sendsB2B: company.sends_b2b,
          categoriesB2B: (compCatsB2B ?? []).map(c => c.category_id),
          billingMethod: company.billing_method ?? 'address',
          billingAddress: company.billing_address ?? '',
          billingPostal: company.billing_postal ?? '',
          billingCity: company.billing_city ?? '',
          billingEmail: company.billing_email ?? '',
        })
      }

      if (catsB2C) setCategories(c => ({ ...c, b2c: catsB2C }))
      if (catsB2B) setCategories(c => ({ ...c, b2b: catsB2B }))
      setLoading(false)
    })
  }, [])

  function toggleCat(id: number, type: 'b2c' | 'b2b') {
    const key = type === 'b2c' ? 'categoriesB2C' : 'categoriesB2B'
    setForm(f => ({
      ...f,
      [key]: (f[key] as number[]).includes(id)
        ? (f[key] as number[]).filter(c => c !== id)
        : [...(f[key] as number[]), id],
    }))
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setLogoFile(file)
    setSaving(true)

    try {
      const fileName = `${userId}-logo-${Date.now()}`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('logos').getPublicUrl(fileName)
      setForm(f => ({ ...f, logoUrl: data.publicUrl }))
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Fel vid uppladdning av logga')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)

    try {
      await supabase.from('companies').update({
        public_name: form.publicName,
        logo_url: form.logoUrl,
        contact_person: form.contactPerson,
        contact_email: form.contactEmail,
        contact_phone: form.contactPhone,
        website: form.website,
        description: form.description,
        counties: form.counties,
        sends_b2b: form.sendsB2B,
        billing_method: form.billingMethod,
        billing_address: form.billingAddress,
        billing_postal: form.billingPostal,
        billing_city: form.billingCity,
        billing_email: form.billingEmail,
      }).eq('id', userId)

      await supabase.from('company_categories_b2c').delete().eq('company_id', userId)
      if (form.categoriesB2C.length > 0) {
        await supabase.from('company_categories_b2c').insert(
          form.categoriesB2C.map(catId => ({ company_id: userId, category_id: catId }))
        )
      }

      await supabase.from('company_categories_b2b').delete().eq('company_id', userId)
      if (form.categoriesB2B.length > 0) {
        await supabase.from('company_categories_b2b').insert(
          form.categoriesB2B.map(catId => ({ company_id: userId, category_id: catId }))
        )
      }

      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving:', error)
      alert('Fel vid sparande')
      setSaving(false)
    }
  }

  const mainCatsB2C = categories.b2c.filter(c => c.parent_id === null)
  const subCatsB2C = (pid: number) => categories.b2c.filter(c => c.parent_id === pid)
  const mainCatsB2B = categories.b2b.filter(c => c.parent_id === null)
  const subCatsB2B = (pid: number) => categories.b2b.filter(c => c.parent_id === pid)

  if (loading) return <div className="py-20 text-center text-gray-400">Laddar...</div>

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Min sida</h1>
          <p className="text-sm text-gray-500">Hantera ditt företagskonto</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4" /> Sparat!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Registration info (read-only) */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Registreringuppgifter</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">Registrerat företagsnamn</label>
            <input type="text" disabled className="input-field" value={form.registeredName} />
            <p className="mt-1 text-xs text-gray-400">Kan inte ändras</p>
          </div>
        </div>

        {/* Company info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Företagsinformation</h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Företagsnamn för public</label>
            <input type="text" className="input-field" value={form.publicName}
              onChange={e => setForm(f => ({ ...f, publicName: e.target.value }))} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">Logga</label>
            {form.logoUrl && (
              <img src={form.logoUrl} alt="Logo" className="mb-3 h-16 w-16 rounded-lg object-contain" />
            )}
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition">
                <Upload className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                <p className="text-sm font-medium text-gray-700">Klicka för att byta logga</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Kontaktperson</label>
            <input type="text" className="input-field" value={form.contactPerson}
              onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Kontakte-postadress</label>
            <input type="email" className="input-field" value={form.contactEmail}
              onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Kontakttelefon</label>
            <input type="tel" className="input-field" value={form.contactPhone}
              onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Webbplats</label>
            <input type="url" className="input-field" value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Beskrivning</label>
            <textarea className="input-field" rows={4} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Län</label>
            <select
              multiple
              className="input-field"
              value={form.counties}
              onChange={e => setForm(f => ({
                ...f,
                counties: Array.from(e.target.selectedOptions, o => o.value),
              }))}
              size={5}
            >
              {SWEDISH_COUNTIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Håll Ctrl/Cmd för att välja flera</p>
          </div>
        </div>

        {/* B2C categories */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">B2C Kategorier</h2>
          <div className="max-h-48 overflow-y-auto space-y-4">
            {mainCatsB2C.map(main => (
              <div key={main.id}>
                <p className="mb-2 text-xs font-bold uppercase text-gray-400">{main.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  {subCatsB2C(main.id).map(sub => (
                    <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={form.categoriesB2C.includes(sub.id)}
                        onChange={() => toggleCat(sub.id, 'b2c')}
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
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">B2B</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={form.sendsB2B}
                onChange={e => setForm(f => ({ ...f, sendsB2B: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Skicka B2B-reklam</span>
            </label>
          </div>

          {form.sendsB2B && (
            <div>
              <p className="mb-3 text-sm font-medium text-gray-600">B2B Kategorier</p>
              <div className="max-h-48 overflow-y-auto space-y-4">
                {mainCatsB2B.map(main => (
                  <div key={main.id}>
                    <p className="mb-2 text-xs font-bold uppercase text-gray-400">{main.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {subCatsB2B(main.id).map(sub => (
                        <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={form.categoriesB2B.includes(sub.id)}
                            onChange={() => toggleCat(sub.id, 'b2b')}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                          <span className="text-sm text-gray-600">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Billing */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Fakturering</h2>
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio"
                checked={form.billingMethod === 'address'}
                onChange={() => setForm(f => ({ ...f, billingMethod: 'address' }))}
                className="h-4 w-4" />
              <span className="text-sm text-gray-700">Postalisk faktura</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio"
                checked={form.billingMethod === 'email'}
                onChange={() => setForm(f => ({ ...f, billingMethod: 'email' }))}
                className="h-4 w-4" />
              <span className="text-sm text-gray-700">E-postfaktura</span>
            </label>
          </div>

          {form.billingMethod === 'address' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Fakturaadress</label>
                <input type="text" className="input-field" value={form.billingAddress}
                  onChange={e => setForm(f => ({ ...f, billingAddress: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">Postnummer</label>
                  <input type="text" className="input-field" value={form.billingPostal}
                    onChange={e => setForm(f => ({ ...f, billingPostal: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">Ort</label>
                  <input type="text" className="input-field" value={form.billingCity}
                    onChange={e => setForm(f => ({ ...f, billingCity: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {form.billingMethod === 'email' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Fakturaadress</label>
              <input type="email" className="input-field" value={form.billingEmail}
                onChange={e => setForm(f => ({ ...f, billingEmail: e.target.value }))} />
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Sparar...' : 'Spara ändringar'}
        </button>
      </form>
    </div>
  )
}
