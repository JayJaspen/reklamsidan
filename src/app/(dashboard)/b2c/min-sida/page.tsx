'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SWEDISH_COUNTIES } from '@/lib/utils'
import { Loader2, CheckCircle } from 'lucide-react'

export default function B2CMinSida() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [userId, setUserId]   = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: number; name: string; parent_id: number | null }[]>([])

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    street: '', postalCode: '', city: '', countyId: '',
    selectedCats: [] as number[],
    birthYear: 0, gender: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      const [{ data: b2c }, { data: cats }, { data: userCats }] = await Promise.all([
        supabase.from('users_b2c').select('*').eq('id', user.id).single(),
        supabase.from('categories_b2c').select('id,name,parent_id').eq('is_active', true).order('sort_order'),
        supabase.from('users_b2c_categories').select('category_id').eq('user_id', user.id),
      ])

      if (b2c) {
        setForm({
          firstName: b2c.first_name,
          lastName:  b2c.last_name,
          email:     b2c.email,
          street:    b2c.street_address ?? '',
          postalCode:b2c.postal_code ?? '',
          city:      b2c.city ?? '',
          countyId:  String(b2c.county_id ?? ''),
          birthYear: b2c.birth_year,
          gender:    b2c.gender,
          selectedCats: (userCats ?? []).map(c => c.category_id),
        })
      }
      if (cats) setCategories(cats)
      setLoading(false)
    })
  }, [])

  function toggleCat(id: number) {
    setForm(f => ({
      ...f,
      selectedCats: f.selectedCats.includes(id)
        ? f.selectedCats.filter(c => c !== id)
        : [...f.selectedCats, id],
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)

    await supabase.from('users_b2c').update({
      first_name:     form.firstName,
      last_name:      form.lastName,
      email:          form.email,
      street_address: form.street,
      postal_code:    form.postalCode,
      city:           form.city,
      county_id:      form.countyId ? parseInt(form.countyId) : null,
    }).eq('id', userId)

    await supabase.from('users_b2c_categories').delete().eq('user_id', userId)
    if (form.selectedCats.length > 0) {
      await supabase.from('users_b2c_categories').insert(
        form.selectedCats.map(catId => ({ user_id: userId, category_id: catId }))
      )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const mainCats = categories.filter(c => c.parent_id === null)
  const subCats  = (pid: number) => categories.filter(c => c.parent_id === pid)

  if (loading) return <div className="py-20 text-center text-gray-400">Laddar...</div>

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Min sida</h1>
          <p className="text-sm text-gray-500">Redigera dina uppgifter och intressen</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4" /> Sparat!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Personuppgifter</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Förnamn</label>
              <input type="text" className="input-field" value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Efternamn</label>
              <input type="text" className="input-field" value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">E-postadress</label>
            <input type="email" className="input-field" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          {/* Ej redigerbara */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-400">Födelseår</label>
              <input type="text" disabled className="input-field" value={form.birthYear} />
              <p className="mt-1 text-xs text-gray-400">Kan inte ändras</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-400">Kön</label>
              <input type="text" disabled className="input-field capitalize" value={form.gender} />
              <p className="mt-1 text-xs text-gray-400">Kan inte ändras</p>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Adress</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Gatuadress</label>
            <input type="text" className="input-field" value={form.street}
              onChange={e => setForm(f => ({ ...f, street: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Postnummer</label>
              <input type="text" className="input-field" value={form.postalCode}
                onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Ort</label>
              <input type="text" className="input-field" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Län</label>
            <select className="input-field" value={form.countyId}
              onChange={e => setForm(f => ({ ...f, countyId: e.target.value }))}>
              <option value="">Välj län</option>
              {SWEDISH_COUNTIES.map((c, i) => <option key={c} value={String(i + 1)}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Kategorier jag är intresserad av
          </h2>
          <div className="max-h-72 overflow-y-auto space-y-4">
            {mainCats.map(main => (
              <div key={main.id}>
                <p className="mb-2 text-xs font-bold uppercase text-gray-400">{main.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  {subCats(main.id).map(sub => (
                    <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={form.selectedCats.includes(sub.id)}
                        onChange={() => toggleCat(sub.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                      <span className="text-sm text-gray-600">{sub.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Sparar...' : 'Spara ändringar'}
        </button>
      </form>
    </div>
  )
}
