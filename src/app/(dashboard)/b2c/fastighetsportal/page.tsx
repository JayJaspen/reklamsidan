'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { JOB_COUNTIES, CITIES_BY_COUNTY } from '@/lib/utils'
import { Loader2, ChevronDown, ChevronUp, Home, X, Search, Bell, Trash2, Plus, Eye, EyeOff } from 'lucide-react'

const B2C_TYPES = ['Lägenhet', 'Villa', 'Radhus', 'Tomt'] as const
const ROOM_OPTIONS = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '7', '8']
const TYPES_WITH_ROOMS = ['Lägenhet', 'Villa', 'Radhus']

type Property = {
  id: number
  company_id: string
  property_type: string
  listing_type: string
  title: string
  description: string
  address: string | null
  city: string
  county: string
  price: number | null
  price_period: string | null
  monthly_fee: number | null
  size_sqm: number | null
  rooms: number | null
  build_year: number | null
  image_urls: string[]
  created_at: string
  companies: { public_name: string; logo_url: string | null }[] | null
  contact_name:  string | null
  contact_phone: string | null
  contact_email: string | null
}

type Watchlist = {
  id: number
  label: string
  property_types: string[]
  listing_type: string
  county: string
  max_price: number | null
  max_monthly_fee: number | null
  min_rooms: number | null
}

export default function B2CFastighetsportal() {
  const supabase = createClient()

  const [userId,      setUserId]      = useState<string | null>(null)
  const [properties,  setProperties]  = useState<Property[]>([])
  const [loading,     setLoading]     = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedId,  setExpandedId]  = useState<number | null>(null)
  const [imgIndex,    setImgIndex]    = useState<Record<number, number>>({})

  // Filter
  const [filterType,       setFilterType]       = useState('')
  const [filterListing,    setFilterListing]    = useState('')
  const [filterCounty,     setFilterCounty]     = useState('')
  const [filterMaxPrice,   setFilterMaxPrice]   = useState('')
  const [filterMaxAvgift,  setFilterMaxAvgift]  = useState('')
  const [filterMinRooms,   setFilterMinRooms]   = useState('')

  // Sökes (looking for property)
  const EMPTY_SEEKER = { propertyType: '', listingType: 'forsaljning', county: '', city: '', description: '', contactName: '', contactPhone: '', contactEmail: '' }
  const [mySeekers,       setMySeekers]       = useState<any[]>([])
  const [showSeekerForm,  setShowSeekerForm]  = useState(false)
  const [seekerForm,      setSeekerForm]      = useState(EMPTY_SEEKER)
  const [savingSeeker,    setSavingSeeker]    = useState(false)
  const [seekerError,     setSeekerError]     = useState<string | null>(null)
  const [deletingSeekerId, setDeletingSeekerId] = useState<number | null>(null)

  // Bevakning (watchlist)
  const [watchlists,    setWatchlists]    = useState<Watchlist[]>([])
  const [savingWatch,   setSavingWatch]   = useState(false)
  const [watchLabel,    setWatchLabel]    = useState('')
  const [showWatchForm, setShowWatchForm] = useState(false)
  const [deletingWId,   setDeletingWId]  = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const [{ data: wl }, { data: sk }] = await Promise.all([
        supabase.from('property_watchlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('property_seekers').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      setWatchlists((wl ?? []) as Watchlist[])
      setMySeekers(sk ?? [])
    })
  }, [])

  async function doSearch() {
    setLoading(true)
    setHasSearched(true)
    const { data: propData } = await supabase
      .from('properties')
      .select('id,company_id,property_type,listing_type,title,description,address,city,county,price,price_period,monthly_fee,size_sqm,rooms,build_year,image_urls,created_at,contact_name,contact_phone,contact_email')
      .eq('is_active', true)
      .in('property_type', [...B2C_TYPES])
      .order('created_at', { ascending: false })

    if (propData && propData.length > 0) {
      const companyIds = [...new Set((propData as any[]).map(p => p.company_id))]
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, public_name, logo_url')
        .in('id', companyIds)

      const cMap: Record<string, { public_name: string; logo_url: string | null }> = {}
      ;(companiesData ?? []).forEach((c: any) => { cMap[c.id] = c })

      const merged = (propData as any[]).map(p => ({
        ...p,
        companies: cMap[p.company_id] ? [cMap[p.company_id]] : null,
      })) as Property[]
      setProperties(merged)
    } else {
      setProperties([])
    }
    setLoading(false)
  }

  // Klientfiltrering
  const filtered = properties.filter(p => {
    if (filterType    && p.property_type !== filterType)    return false
    if (filterListing && p.listing_type  !== filterListing) return false
    if (filterCounty  && p.county        !== filterCounty)  return false
    if (filterMaxPrice) {
      const max = parseInt(filterMaxPrice)
      if (!isNaN(max) && p.price != null && p.price > max) return false
    }
    if (filterMaxAvgift && p.property_type === 'Lägenhet' && p.listing_type === 'forsaljning') {
      const max = parseInt(filterMaxAvgift)
      if (!isNaN(max) && p.monthly_fee != null && p.monthly_fee > max) return false
    }
    if (filterMinRooms) {
      const min = parseFloat(filterMinRooms)
      if (!isNaN(min) && TYPES_WITH_ROOMS.includes(p.property_type)) {
        if (p.rooms == null || p.rooms < min) return false
      }
    }
    return true
  })

  function clearFilters() {
    setFilterType('')
    setFilterListing('')
    setFilterCounty('')
    setFilterMaxPrice('')
    setFilterMaxAvgift('')
    setFilterMinRooms('')
  }

  const hasFilters = filterType || filterListing || filterCounty || filterMaxPrice || filterMaxAvgift || filterMinRooms

  // Visar Maxhyra för uthyrning ELLER Maxavgift för Lägenhet + försäljning (eller "alla")
  const showMaxHyra   = filterListing === 'uthyrning'
  const showMaxAvgift = filterType === 'Lägenhet' && filterListing !== 'uthyrning'

  function prevImg(id: number, total: number) {
    setImgIndex(prev => ({ ...prev, [id]: ((prev[id] ?? 0) - 1 + total) % total }))
  }
  function nextImg(id: number, total: number) {
    setImgIndex(prev => ({ ...prev, [id]: ((prev[id] ?? 0) + 1) % total }))
  }

  async function saveWatchlist() {
    if (!userId) return
    setSavingWatch(true)
    const payload: any = {
      user_id:        userId,
      label:          watchLabel.trim() || 'Bevakning',
      property_types: filterType ? [filterType] : [],
      listing_type:   filterListing,
      county:         filterCounty,
      max_price:      filterMaxPrice ? parseInt(filterMaxPrice) : null,
      max_monthly_fee: filterMaxAvgift ? parseInt(filterMaxAvgift) : null,
      min_rooms:      filterMinRooms ? parseFloat(filterMinRooms) : null,
    }
    const { data } = await supabase
      .from('property_watchlists')
      .insert(payload)
      .select()
      .single()
    if (data) setWatchlists(prev => [data as Watchlist, ...prev])
    setWatchLabel('')
    setShowWatchForm(false)
    setSavingWatch(false)
  }

  async function deleteWatchlist(id: number) {
    setDeletingWId(id)
    await supabase.from('property_watchlists').delete().eq('id', id)
    setWatchlists(prev => prev.filter(w => w.id !== id))
    setDeletingWId(null)
  }

  async function saveSeeker() {
    if (!userId) return
    if (!seekerForm.propertyType)  { setSeekerError('Välj fastighetstyp.'); return }
    if (!seekerForm.description.trim()) { setSeekerError('Beskriv vad du söker.'); return }
    if (!seekerForm.contactName.trim()) { setSeekerError('Ange ditt namn.'); return }
    setSavingSeeker(true); setSeekerError(null)
    const payload = {
      user_id:       userId,
      property_type: seekerForm.propertyType,
      listing_type:  seekerForm.listingType,
      county:        seekerForm.county,
      city:          seekerForm.city,
      description:   seekerForm.description.trim(),
      contact_name:  seekerForm.contactName.trim(),
      contact_phone: seekerForm.contactPhone.trim(),
      contact_email: seekerForm.contactEmail.trim(),
      is_active:     true,
    }
    const { data, error } = await supabase.from('property_seekers').insert(payload).select().single()
    if (error) { setSeekerError('Kunde inte spara: ' + error.message); setSavingSeeker(false); return }
    if (data) setMySeekers(prev => [data, ...prev])
    setSeekerForm(EMPTY_SEEKER)
    setShowSeekerForm(false)
    setSavingSeeker(false)
  }

  async function deleteSeeker(id: number) {
    if (!confirm('Ta bort sökes-annonsen?')) return
    setDeletingSeekerId(id)
    await supabase.from('property_seekers').delete().eq('id', id)
    setMySeekers(prev => prev.filter(s => s.id !== id))
    setDeletingSeekerId(null)
  }

  async function toggleSeekerActive(s: any) {
    const next = !s.is_active
    await supabase.from('property_seekers').update({ is_active: next }).eq('id', s.id)
    setMySeekers(prev => prev.map(x => x.id === s.id ? { ...x, is_active: next } : x))
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fastighetsportal</h1>
        <p className="text-sm text-gray-500">Bostäder till försäljning och uthyrning</p>
      </div>

      {/* Filter */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Typ</label>
            <select className="input-field" value={filterType} onChange={e => { setFilterType(e.target.value); setFilterMaxAvgift('') }}>
              <option value="">Alla typer</option>
              {B2C_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Annonstyp</label>
            <select className="input-field" value={filterListing} onChange={e => { setFilterListing(e.target.value); setFilterMaxPrice('') }}>
              <option value="">Alla</option>
              <option value="forsaljning">Till försäljning</option>
              <option value="uthyrning">Uthyrning</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Län</label>
            <select className="input-field" value={filterCounty} onChange={e => setFilterCounty(e.target.value)}>
              <option value="">Alla län</option>
              {JOB_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Maxpris – visas när uthyrning INTE är valt */}
          {!showMaxHyra && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Maxpris (kr)</label>
              <input
                type="number"
                className="input-field"
                placeholder="t.ex. 3000000"
                min={0}
                value={filterMaxPrice}
                onChange={e => setFilterMaxPrice(e.target.value)}
              />
            </div>
          )}

          {/* Maxhyra – visas vid uthyrning */}
          {showMaxHyra && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Maxhyra (kr/mån)</label>
              <input
                type="number"
                className="input-field"
                placeholder="t.ex. 10000"
                min={0}
                value={filterMaxPrice}
                onChange={e => setFilterMaxPrice(e.target.value)}
              />
            </div>
          )}

          {/* Maxavgift – visas för Lägenhet + försäljning */}
          {showMaxAvgift && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Maxavgift (kr/mån)</label>
              <input
                type="number"
                className="input-field"
                placeholder="t.ex. 4000"
                min={0}
                value={filterMaxAvgift}
                onChange={e => setFilterMaxAvgift(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Antal rum (min)</label>
            <select className="input-field" value={filterMinRooms} onChange={e => setFilterMinRooms(e.target.value)}>
              <option value="">Alla</option>
              {ROOM_OPTIONS.map(r => <option key={r} value={r}>{r} rum</option>)}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2">
            <button
              onClick={doSearch}
              disabled={loading}
              className="btn-primary gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? 'Söker...' : 'Sök'}
            </button>
            {hasSearched && (
              <span className="self-center text-xs text-gray-400">{filtered.length} annons{filtered.length !== 1 ? 'er' : ''}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                <X className="h-3.5 w-3.5" /> Rensa filter
              </button>
            )}
            <button
              onClick={() => setShowWatchForm(v => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition"
            >
              <Bell className="h-3.5 w-3.5" />
              Spara bevakning
            </button>
          </div>
        </div>

        {/* Bevakningsformulär */}
        {showWatchForm && (
          <div className="mt-4 border-t border-gray-100 pt-4 flex items-center gap-2">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="Namn på bevakning (valfritt)"
              value={watchLabel}
              onChange={e => setWatchLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveWatchlist()}
            />
            <button onClick={saveWatchlist} disabled={savingWatch} className="btn-primary">
              {savingWatch ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Spara'}
            </button>
            <button onClick={() => setShowWatchForm(false)} className="btn-secondary">Avbryt</button>
          </div>
        )}
      </div>

      {/* Mina bevakningar */}
      {watchlists.length > 0 && (
        <div className="mb-6 card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-gray-800">Mina bevakningar</h2>
            <span className="rounded-full bg-primary-100 px-2 text-xs font-semibold text-primary-700">{watchlists.length}</span>
          </div>
          <div className="space-y-2">
            {watchlists.map(wl => (
              <div key={wl.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-xs text-gray-600">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-800 mr-2">{wl.label}</span>
                  {wl.property_types.length > 0 && <span className="mr-1">{wl.property_types.join(', ')}</span>}
                  {wl.listing_type && <span className="mr-1">· {wl.listing_type === 'forsaljning' ? 'Försäljning' : 'Uthyrning'}</span>}
                  {wl.county && <span className="mr-1">· {wl.county}</span>}
                  {wl.max_price && <span className="mr-1">· Max {wl.max_price.toLocaleString('sv-SE')} kr</span>}
                  {wl.max_monthly_fee && <span className="mr-1">· Maxavgift {wl.max_monthly_fee.toLocaleString('sv-SE')} kr/mån</span>}
                  {wl.min_rooms && <span>· Min {wl.min_rooms} rum</span>}
                </div>
                <button
                  onClick={() => deleteWatchlist(wl.id)}
                  disabled={deletingWId === wl.id}
                  className="shrink-0 text-gray-400 hover:text-red-500 transition"
                  title="Ta bort bevakning"
                >
                  {deletingWId === wl.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">Matchande fastigheter visas under fliken Favoritreklam</p>
        </div>
      )}

      {/* Annonslist */}
      {!hasSearched ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
          <Search className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">Klicka på Sök för att se bostadsannonser</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
          <Home className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">
            {hasFilters ? 'Inga annonser matchar filtret.' : 'Inga bostadsannonser just nu.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const company = p.companies?.[0]
            const isOpen  = expandedId === p.id
            const imgIdx  = imgIndex[p.id] ?? 0
            const hasImgs = p.image_urls.length > 0

            return (
              <div key={p.id} className="card overflow-hidden">
                <button
                  onClick={() => { setExpandedId(isOpen ? null : p.id); setImgIndex(prev => ({ ...prev, [p.id]: 0 })) }}
                  className="w-full text-left flex gap-4 p-4 hover:bg-gray-50 transition"
                >
                  <div className="shrink-0 h-20 w-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                    {hasImgs ? (
                      <img src={p.image_urls[0]} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Home className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{p.title}</span>
                      <span className="badge badge-blue">{p.property_type}</span>
                      <span className={`badge ${p.listing_type === 'forsaljning' ? 'badge-green' : 'badge-yellow'}`}>
                        {p.listing_type === 'forsaljning' ? 'Försäljning' : 'Uthyrning'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {p.address ? `${p.address}, ` : ''}{p.city} · {p.county}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                      {p.price && (
                        <span className="font-semibold text-gray-800">
                          {p.price.toLocaleString('sv-SE')} kr{p.price_period ? ` / ${p.price_period}` : ''}
                        </span>
                      )}
                      {p.monthly_fee && p.property_type === 'Lägenhet' && (
                        <span>Avgift: {p.monthly_fee.toLocaleString('sv-SE')} kr/mån</span>
                      )}
                      {p.size_sqm && <span>{p.size_sqm} kvm</span>}
                      {p.rooms    && <span>{p.rooms} rum</span>}
                      {p.build_year && <span>Byggd {p.build_year}</span>}
                      {company?.public_name && <span className="font-medium text-gray-500">{company.public_name}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-gray-400 self-center">
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                    {hasImgs && (
                      <div className="mb-4 relative rounded-xl overflow-hidden bg-gray-100" style={{ height: '240px' }}>
                        <img src={p.image_urls[imgIdx]} alt={`Bild ${imgIdx + 1}`} className="h-full w-full object-cover" />
                        {p.image_urls.length > 1 && (
                          <>
                            <button onClick={e => { e.stopPropagation(); prevImg(p.id, p.image_urls.length) }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70">‹</button>
                            <button onClick={e => { e.stopPropagation(); nextImg(p.id, p.image_urls.length) }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70">›</button>
                            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
                              <div className="flex gap-1">
                                {p.image_urls.map((_, i) => (
                                  <div key={i} className={`h-1.5 w-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                                ))}
                              </div>
                              <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">{imgIdx + 1} av {p.image_urls.length}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-4">{p.description}</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4">
                      {p.address    && <div><span className="text-gray-400">Adress:</span> <span className="text-gray-700">{p.address}, {p.city}</span></div>}
                      {p.size_sqm   && <div><span className="text-gray-400">Storlek:</span> <span className="text-gray-700">{p.size_sqm} kvm</span></div>}
                      {p.rooms      && <div><span className="text-gray-400">Rum:</span> <span className="text-gray-700">{p.rooms} rum</span></div>}
                      {p.build_year && <div><span className="text-gray-400">Byggd:</span> <span className="text-gray-700">{p.build_year}</span></div>}
                      {p.price      && (
                        <div>
                          <span className="text-gray-400">Pris:</span>{' '}
                          <span className="font-semibold text-gray-900">
                            {p.price.toLocaleString('sv-SE')} kr{p.price_period ? ` / ${p.price_period}` : ''}
                          </span>
                        </div>
                      )}
                      {p.monthly_fee && p.property_type === 'Lägenhet' && (
                        <div><span className="text-gray-400">Avgift:</span> <span className="text-gray-700">{p.monthly_fee.toLocaleString('sv-SE')} kr/mån</span></div>
                      )}
                    </div>
                    {(p.contact_name || p.contact_phone || p.contact_email) && (
                      <div className="mb-4 rounded-xl bg-primary-50 border border-primary-100 px-4 py-3">
                        <p className="text-xs font-semibold text-primary-700 mb-2">Kontakt</p>
                        <div className="space-y-1 text-sm">
                          {p.contact_name  && <p className="text-gray-700">{p.contact_name}</p>}
                          {p.contact_phone && <p><a href={`tel:${p.contact_phone}`} className="text-primary-600 hover:underline">{p.contact_phone}</a></p>}
                          {p.contact_email && <p><a href={`mailto:${p.contact_email}`} className="text-primary-600 hover:underline">{p.contact_email}</a></p>}
                        </div>
                      </div>
                    )}
                    {company && (
                      <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt={company.public_name} className="h-8 w-8 rounded-md object-contain border border-gray-200 bg-white p-0.5" />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                            {company.public_name[0]}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-700">{company.public_name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Söker fastighet ── */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900">Söker fastighet</h2>
            {mySeekers.length > 0 && (
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">{mySeekers.length}</span>
            )}
          </div>
          {!showSeekerForm && (
            <button
              onClick={() => setShowSeekerForm(true)}
              className="btn-primary text-sm"
            >
              <Plus className="h-4 w-4" /> Lägg upp sökes-annons
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Lägg upp en annons om du söker en bostad – synlig för företag i fastighetsportalen.
        </p>

        {/* Sökes form */}
        {showSeekerForm && (
          <div className="card p-5 mb-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Ny sökes-annons</h3>
              <button onClick={() => { setShowSeekerForm(false); setSeekerError(null) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Fastighetstyp *</label>
                  <select className="input-field" value={seekerForm.propertyType} onChange={e => setSeekerForm(f => ({ ...f, propertyType: e.target.value }))}>
                    <option value="">Välj typ</option>
                    {B2C_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Jag vill</label>
                  <select className="input-field" value={seekerForm.listingType} onChange={e => setSeekerForm(f => ({ ...f, listingType: e.target.value }))}>
                    <option value="forsaljning">Köpa</option>
                    <option value="uthyrning">Hyra</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Län</label>
                  <select className="input-field" value={seekerForm.county} onChange={e => setSeekerForm(f => ({ ...f, county: e.target.value, city: '' }))}>
                    <option value="">Alla / Välj</option>
                    {JOB_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Stad</label>
                  {seekerForm.county && CITIES_BY_COUNTY[seekerForm.county] ? (
                    <select className="input-field" value={seekerForm.city} onChange={e => setSeekerForm(f => ({ ...f, city: e.target.value }))}>
                      <option value="">Alla / Välj</option>
                      {CITIES_BY_COUNTY[seekerForm.county].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input type="text" className="input-field" placeholder="Valfritt" value={seekerForm.city} onChange={e => setSeekerForm(f => ({ ...f, city: e.target.value }))} />
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Beskrivning *</label>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  placeholder="Beskriv vad du söker, t.ex. storlek, antal rum, önskemål..."
                  value={seekerForm.description}
                  onChange={e => setSeekerForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Ditt namn *</label>
                  <input type="text" className="input-field" placeholder="Förnamn Efternamn" value={seekerForm.contactName} onChange={e => setSeekerForm(f => ({ ...f, contactName: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Telefon</label>
                  <input type="tel" className="input-field" placeholder="07X-XXX XX XX" value={seekerForm.contactPhone} onChange={e => setSeekerForm(f => ({ ...f, contactPhone: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">E-post</label>
                  <input type="email" className="input-field" placeholder="din@epost.se" value={seekerForm.contactEmail} onChange={e => setSeekerForm(f => ({ ...f, contactEmail: e.target.value }))} />
                </div>
              </div>
              {seekerError && <p className="text-sm text-red-600 font-medium">{seekerError}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={saveSeeker} disabled={savingSeeker} className="btn-primary text-sm">
                  {savingSeeker ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {savingSeeker ? 'Publicerar...' : 'Publicera sökes-annons'}
                </button>
                <button onClick={() => { setShowSeekerForm(false); setSeekerError(null) }} className="btn-secondary text-sm">Avbryt</button>
              </div>
            </div>
          </div>
        )}

        {/* My seekers list */}
        {mySeekers.length === 0 && !showSeekerForm ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
            Du har inga aktiva sökes-annonser
          </div>
        ) : mySeekers.length > 0 ? (
          <div className="space-y-2">
            {mySeekers.map((s: any) => (
              <div key={s.id} className={`card flex items-start gap-3 p-4 ${!s.is_active ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="badge badge-blue">{s.property_type}</span>
                    <span className={`badge ${s.listing_type === 'forsaljning' ? 'badge-green' : 'badge-yellow'}`}>
                      {s.listing_type === 'forsaljning' ? 'Köpes' : 'Söker hyra'}
                    </span>
                    {s.county && <span className="text-xs text-gray-500">{s.city ? `${s.city}, ` : ''}{s.county}</span>}
                    {!s.is_active && <span className="badge badge-red">Inaktiv</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{s.description}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => toggleSeekerActive(s)}
                    className={`p-1.5 rounded-lg transition text-xs ${s.is_active ? 'text-gray-400 hover:text-orange-600' : 'text-orange-500 hover:text-green-600'}`}
                    title={s.is_active ? 'Inaktivera' : 'Aktivera'}
                  >
                    {s.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => deleteSeeker(s.id)}
                    disabled={deletingSeekerId === s.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 transition disabled:opacity-40"
                    title="Ta bort"
                  >
                    {deletingSeekerId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
