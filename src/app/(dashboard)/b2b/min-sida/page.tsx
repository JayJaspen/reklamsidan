'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SWEDISH_COUNTIES } from '@/lib/utils'
import { Loader2, CheckCircle } from 'lucide-react'

export default function B2BMinSida() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [userId, setUserId]   = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: number; name: string; parent_id: number | null }[]>([])

  const [form, setForm] = useState({
    companyName: '',
    email: '',
    street: '',
    postalCode: '',
    city: '',
    countyId: '',
    selectedCats: [] as number[],
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      const [{ data: b2b }, { data: cats }, { data: userCats }] = await Promise.all([
        supabase.from('users_b2b').select('*').eq('id', user.id).single(),
        supabase.from('categories_b2b').select('id,name,parent_id').eq('is_active', true).order('sort_order'),
        supabase.from('users_b2b_categories').select('category_id').eq('user_id', user.id),
      ])

      if (b2b) {
        setForm({
          companyName: b2b.company_name,
          email: b2b.email,
          street: b2b.street_address ?? '',
          postalCode: b2b.postal_code ?? '',
          city: b2b.city ?? '',
          countyId: String(b2b.county_id ?? ''),
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

    await supabase.from('users_b2b').update({
      company_name:   form.companyName,
      email:          form.email,
      street_address: form.street,
      postal_code:    form.postalCode,
      city:           form.city,
      county_id:      form.countyId ? parseInt(form.countyId) : null,
    }).eq('id', userId)

    await supabase.from('users_b2b_categories').delete().eq('user_id', userId)
    if (form.selectedCats.length > 0) {
      await supabase.from('users_b2b_categories').insert(
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
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Företagsuppgifter</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Företagsnamn</label>
            <input type="text" className="input-field" value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">E-postadress</label>
            <input type="email" className="input-field" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
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
              {SWEDISH_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
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
