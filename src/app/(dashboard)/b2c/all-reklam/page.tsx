'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdCard from '@/components/AdCard'
import { Search, Heart, Globe } from 'lucide-react'
import { SWEDISH_COUNTIES } from '@/lib/utils'

const ALPHABET = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','Å','Ä','Ö']

type CategoryOpt = { id: number; name: string; parent_id: number | null }

export default function B2CAllReklam() {
  const supabase = createClient()
  const [userId, setUserId]      = useState<string | null>(null)
  const [filter, setFilter]      = useState({ query: '', category: '', county: '' })
  const [allCategories, setAllCategories] = useState<CategoryOpt[]>([])
  const [companies, setCompanies] = useState<{
    id: string; public_name: string; logo_url: string | null; ad_count: number
  }[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [ads, setAds]            = useState<unknown[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [searched, setSearched]  = useState(false)
  const [loading, setLoading]    = useState(false)
  const [activeLetter, setActiveLetter] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        supabase.from('user_favorites').select('company_id').eq('user_id', user.id)
          .then(({ data }) => {
            if (data) setFavorites(new Set(data.map(f => f.company_id)))
          })
      }
    })
    // Ladda kategorier för filter
    supabase.from('categories_b2c').select('id, name, parent_id').eq('is_active', true).order('sort_order')
      .then(({ data }) => { if (data) setAllCategories(data) })
  }, [])

  // currentFilter kan skickas in direkt från onChange-hanterare för att undvika
  // stale-closure-problem när state inte hunnit uppdateras ännu
  async function handleSearch(currentFilter = filter) {
    setLoading(true)
    setSearched(true)
    setSelectedCompany(null)
    setAds([])
    setActiveLetter('')
    setCompanies([])

    // Only show companies that target B2C (sends_b2c = true)
    let query = supabase
      .from('companies')
      .select('id, public_name, logo_url')
      .eq('is_active', true)
      .eq('sends_b2c', true)

    // Category filter: find company_ids matching the selected category
    if (currentFilter.category) {
      const catId = parseInt(currentFilter.category)
      const { data: subCats } = await supabase
        .from('categories_b2c')
        .select('id')
        .or(`id.eq.${catId},parent_id.eq.${catId}`)
        .eq('is_active', true)
      const catIds = (subCats ?? []).map(c => c.id)
      if (catIds.length > 0) {
        const { data: catLinks } = await supabase
          .from('company_categories_b2c')
          .select('company_id')
          .in('category_id', catIds)
        const catCompanyIds = [...new Set((catLinks ?? []).map((r: any) => r.company_id as string))]
        if (catCompanyIds.length === 0) {
          setCompanies([])
          setLoading(false)
          return
        }
        query = query.in('id', catCompanyIds)
      }
    }

    if (currentFilter.query) {
      query = query.ilike('public_name', `%${currentFilter.query}%`)
    }

    const { data } = await query.order('public_name')
    let filteredIds = (data ?? []).map(c => c.id)

    if (filteredIds.length === 0) {
      setCompanies([])
      setLoading(false)
      return
    }

    // County filter – applied after fetching companies.
    // Companies with NO county entries are treated as "nationwide" and always included.
    if (currentFilter.county) {
      const countyIdx = (SWEDISH_COUNTIES as readonly string[]).indexOf(currentFilter.county)
      if (countyIdx >= 0) {
        const selectedCountyId = countyIdx + 1
        const { data: countyRows } = await supabase
          .from('company_counties')
          .select('company_id, county_id')
          .in('company_id', filteredIds)
        const countyMap: Record<string, number[]> = {}
        ;(countyRows ?? []).forEach((r: any) => {
          if (!countyMap[r.company_id]) countyMap[r.company_id] = []
          countyMap[r.company_id].push(r.county_id)
        })
        filteredIds = filteredIds.filter(id => {
          const counties = countyMap[id]
          if (!counties || counties.length === 0) return true  // Inget län = rikstäckande
          return counties.includes(selectedCountyId)
        })
      }
    }

    if (filteredIds.length === 0) {
      setCompanies([])
      setLoading(false)
      return
    }

    // Hämta annonsräkningar för alla matchande företag i ett enda RPC-anrop (löser N+1)
    const { data: withCount } = await supabase.rpc('get_companies_with_ad_count', {
      p_type: 'b2c',
      p_company_ids: filteredIds,
    })

    setCompanies(withCount ?? [])
    setLoading(false)
  }

  async function handleSelectCompany(companyId: string) {
    setSelectedCompany(companyId)
    const { data } = await supabase
      .from('active_ads')
      .select('*')
      .eq('company_id', companyId)
      .eq('ad_type', 'b2c')
      .order('valid_to')
    setAds(data ?? [])
  }

  async function toggleFavorite(companyId: string) {
    if (!userId) return
    if (favorites.has(companyId)) {
      await supabase.from('user_favorites').delete()
        .eq('user_id', userId).eq('company_id', companyId)
      setFavorites(f => { const n = new Set(f); n.delete(companyId); return n })
    } else {
      await supabase.from('user_favorites').insert({ user_id: userId, company_id: companyId })
      setFavorites(f => new Set(f).add(companyId))
    }
  }

  const parentCats = allCategories.filter(c => c.parent_id === null)
  const subCatsFor = (pid: number) => allCategories.filter(c => c.parent_id === pid)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="h-6 w-6 text-green-500" /> All reklam
        </h1>
        <p className="text-sm text-gray-500">Sök och utforska alla annonsörföretag</p>
      </div>

      {/* Search */}
      <div className="card mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Sök på företagsnamn</label>
            <input type="text" className="input-field" value={filter.query}
              onChange={e => setFilter(f => ({ ...f, query: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="t.ex. ICA, Elgiganten..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Kategori</label>
            <select className="input-field" value={filter.category}
              onChange={e => {
                const category = e.target.value
                const newFilter = { ...filter, category }
                setFilter(newFilter)
                if (searched) handleSearch(newFilter)
              }}>
              <option value="">Alla kategorier</option>
              {parentCats.map(parent => (
                <optgroup key={parent.id} label={parent.name}>
                  {subCatsFor(parent.id).map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Län</label>
            <select className="input-field" value={filter.county}
              onChange={e => {
                const county = e.target.value
                const newFilter = { ...filter, county }
                setFilter(newFilter)
                if (searched) handleSearch(newFilter)
              }}>
              <option value="">Alla län</option>
              {SWEDISH_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => handleSearch()} disabled={loading}
          className="btn-primary mt-4 gap-2">
          <Search className="h-4 w-4" />
          {loading ? 'Söker...' : 'Sök'}
        </button>
      </div>

      {!searched ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
          <Search className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">Sök för att se företag och deras reklam</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Company list */}
          <div className="lg:col-span-1">
            <p className="mb-3 text-sm font-medium text-gray-600">{companies.length} företag hittades</p>
            {/* Alphabet bar */}
            <div className="flex flex-wrap gap-0.5 mb-3">
              <button onClick={() => setActiveLetter('')}
                className={`rounded px-1.5 py-0.5 text-xs font-semibold transition ${activeLetter === '' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >Alla</button>
              {ALPHABET.map(l => (
                <button key={l} onClick={() => setActiveLetter(activeLetter === l ? '' : l)}
                  className={`rounded px-1.5 py-0.5 text-xs font-semibold transition ${activeLetter === l ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >{l}</button>
              ))}
            </div>
            <div className="space-y-2">
              {companies.filter(c => !activeLetter || c.public_name.toUpperCase().startsWith(activeLetter)).map(c => (
                <div key={c.id}
                  className={`card flex items-center gap-3 p-3 cursor-pointer transition hover:shadow-md ${selectedCompany === c.id ? 'ring-2 ring-primary-500' : ''}`}
                  onClick={() => handleSelectCompany(c.id)}
                >
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.public_name} className="h-10 w-10 rounded-lg object-contain" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold">
                      {c.public_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.public_name}</p>
                    <p className="text-xs text-gray-400">{c.ad_count} aktiva erbjudanden</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleFavorite(c.id) }}
                    title={favorites.has(c.id) ? 'Ta bort favorit' : 'Lägg till favorit'}
                    className={`rounded-full p-1.5 transition ${favorites.has(c.id) ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:text-red-400'}`}
                  >
                    <Heart className={`h-4 w-4 ${favorites.has(c.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Ads */}
          <div className="lg:col-span-2">
            {selectedCompany ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {ads.map((ad: unknown) => {
                  const a = ad as { id: string }
                  return <AdCard key={a.id} ad={ad as Parameters<typeof AdCard>[0]['ad']}
                    userId={userId ?? ''} tabSource={3} />
                })}
                {ads.length === 0 && (
                  <p className="col-span-2 py-8 text-center text-gray-400 text-sm">
                    Inga aktiva annonser för detta företag just nu
                  </p>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
                <p className="text-sm">Klicka på ett företag för att se deras reklam</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
