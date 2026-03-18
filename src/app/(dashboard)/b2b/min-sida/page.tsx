'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SWEDISH_COUNTIES } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Loader2, CheckCircle } from 'lucide-react'

export default function B2BMinSida() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [userId, setUserId]   = useState<string | null>(null)
  const [showCancel, setShowCancel]   = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState('')
  const [cancelling, setCancelling]   = useState(false)

  const [pwForm, setPwForm]   = useState({ newPw: '', confirmPw: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg]     = useState<{ ok: boolean; text: string } | null>(null)
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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (!pwForm.newPw || !pwForm.confirmPw) {
      setPwMsg({ ok: false, text: 'Fyll i båda fälten.' })
      return
    }
    if (pwForm.newPw !== pwForm.confirmPw) {
      setPwMsg({ ok: false, text: 'Lösenorden matchar inte.' })
      return
    }
    if (pwForm.newPw.length < 6) {
      setPwMsg({ ok: false, text: 'Lösenordet måste vara minst 6 tecken.' })
      return
    }
    setPwSaving(true)
    setPwMsg(null)
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
    setPwSaving(false)
    if (error) {
      setPwMsg({ ok: false, text: `Fel: ${error.message}` })
    } else {
      setPwMsg({ ok: true, text: 'Lösenordet har ändrats!' })
      setPwForm({ newPw: '', confirmPw: '' })
      setTimeout(() => setPwMsg(null), 4000)
    }
  }

  async function handleCancelService() {
    if (!userId) return
    setCancelling(true)
    const { error } = await supabase.from('users_b2b').delete().eq('id', userId)
    if (error) {
      toast('Kunde inte avsluta tjänsten: ' + error.message, 'error')
      setCancelling(false)
      return
    }
    await supabase.auth.signOut()
    router.push('/')
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

      {/* Lösenordsbyte – separat formulär */}
      <form onSubmit={handlePasswordChange} className="mt-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Byt lösenord</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Nytt lösenord</label>
            <input
              type="password"
              className="input-field"
              placeholder="Minst 6 tecken"
              value={pwForm.newPw}
              onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Bekräfta nytt lösenord</label>
            <input
              type="password"
              className="input-field"
              placeholder="Upprepa lösenordet"
              value={pwForm.confirmPw}
              onChange={e => setPwForm(f => ({ ...f, confirmPw: e.target.value }))}
            />
          </div>
          {pwMsg && (
            <p className={`text-sm font-medium ${pwMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
              {pwMsg.text}
            </p>
          )}
          <button type="submit" disabled={pwSaving} className="btn-primary w-full py-3">
            {pwSaving ? <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" /> : null}
            {pwSaving ? 'Sparar...' : 'Byt lösenord'}
          </button>
        </div>
      </form>

      {/* Avsluta tjänsten */}
      <div className="mt-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide">⚠️ Avsluta tjänsten</h2>
            <p className="mt-1 text-sm text-red-600">
              Ditt konto och alla dina uppgifter raderas permanent. Detta går inte att ångra.
            </p>
          </div>
          {!showCancel ? (
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition"
            >
              Avsluta tjänsten
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-700 font-medium">
                Skriv <span className="font-bold">AVSLUTA</span> för att bekräfta
              </p>
              <input
                type="text"
                className="input-field border-red-300 focus:ring-red-400"
                placeholder="AVSLUTA"
                value={cancelConfirm}
                onChange={e => setCancelConfirm(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelService}
                  disabled={cancelling || cancelConfirm !== 'AVSLUTA'}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin inline-block mr-1.5" /> : null}
                  {cancelling ? 'Avslutar...' : 'Bekräfta och avsluta'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCancel(false); setCancelConfirm('') }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
