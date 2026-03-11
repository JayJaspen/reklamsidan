'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, Search, Building2, Globe } from 'lucide-react'
import { SWEDISH_COUNTIES } from '@/lib/utils'

type Company = {
  id: string
  public_name: string
  logo_url: string | null
  company_description: string | null
  website: string | null
  categories: string[]
}

export default function B2CFavoriter() {
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Mina favoriter
  const [favorites, setFavorites] = useState<Company[]>([])
  // notify_jobs per company_id
  const [jobNotify, setJobNotify] = useState<Record<string, boolean>>({})

  // Sökning – hitta nya företag
  const [searchName, setSearchName] = useState('')
  const [searchCategory, setSearchCategory] = useState('')
  const [searchCounty, setSearchCounty] = useState('')
  const [allCategories, setAllCategories] = useState<{ id: number; name: string; parent_id: number | null }[]>([])
  const [searchResults, setSearchResults] = useState<Company[]>([])
  const [searching, setSearching] = useState(false)

  // Set av company-id:s som följs (för snabb lookup)
  const followedIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      await loadFavorites(user.id)
      await loadCategories()
      setLoading(false)
      // Visa alla B2C-företag direkt utan att behöva söka
      await handleSearch('', '', '')
    })
  }, [])

  async function loadFavorites(uid: string) {
    const { data } = await supabase
      .from('user_favorites')
      .select('company_id, notify_jobs')
      .eq('user_id', uid)

    if (!data || data.length === 0) { setFavorites([]); return }

    // Build notify_jobs map
    const notifyMap: Record<string, boolean> = {}
    data.forEach((f: any) => { notifyMap[f.company_id] = f.notify_jobs ?? false })
    setJobNotify(notifyMap)

    const ids = data.map((f: any) => f.company_id)
    const { data: companies } = await supabase
      .from('companies')
      .select('id, public_name, logo_url, company_description, website')
      .in('id', ids)
      .eq('is_active', true)
      .order('public_name')

    if (!companies) { setFavorites([]); return }

    // Hämta kategorier för dessa företag
    const { data: catLinks } = await supabase
      .from('company_categories_b2c')
      .select('company_id, categories_b2c(name)')
      .in('company_id', ids)

    const catMap: Record<string, string[]> = {}
    ;(catLinks ?? []).forEach((row: any) => {
      if (!catMap[row.company_id]) catMap[row.company_id] = []
      if (row.categories_b2c?.name) catMap[row.company_id].push(row.categories_b2c.name)
    })

    setFavorites(companies.map(c => ({ ...c, categories: catMap[c.id] ?? [] })))
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories_b2c')
      .select('id, name, parent_id')
      .eq('is_active', true)
      .order('name')
    setAllCategories(data ?? [])
  }

  // name/category/county kan skickas in direkt för att stödja auto-sökning vid mount
  async function handleSearch(
    name = searchName,
    category = searchCategory,
    county = searchCounty,
  ) {
    setSearching(true)

    let companyIds: string[] | null = null

    // Kategorifilter: löser ut underkategorier och hitta matchande company_ids
    if (category) {
      const catId = parseInt(category)
      const { data: subCats } = await supabase
        .from('categories_b2c')
        .select('id')
        .or(`id.eq.${catId},parent_id.eq.${catId}`)
        .eq('is_active', true)
      const catIds = (subCats ?? []).map(c => c.id)

      const { data: catLinks } = await supabase
        .from('company_categories_b2c')
        .select('company_id')
        .in('category_id', catIds)
      companyIds = [...new Set((catLinks ?? []).map((r: any) => r.company_id as string))]
      if (companyIds.length === 0) {
        setSearchResults([])
        setSearching(false)
        return
      }
    }

    // Länsfilter
    let countyCompanyIds: string[] | null = null
    if (county) {
      const countyIdx = (SWEDISH_COUNTIES as readonly string[]).indexOf(county)
      if (countyIdx >= 0) {
        const { data: countyLinks } = await supabase
          .from('company_counties')
          .select('company_id')
          .eq('county_id', countyIdx + 1)
        countyCompanyIds = (countyLinks ?? []).map((r: any) => r.company_id as string)
        if (countyCompanyIds.length === 0) {
          setSearchResults([])
          setSearching(false)
          return
        }
      }
    }

    let q = supabase
      .from('companies')
      .select('id, public_name, logo_url, company_description, website')
      .eq('is_active', true)
      .eq('sends_b2c', true)  // Visa bara B2C-aktiva företag
      .order('public_name')

    if (name) q = q.ilike('public_name', `%${name}%`)
    if (companyIds) q = q.in('id', companyIds)
    if (countyCompanyIds) q = q.in('id', countyCompanyIds)

    const { data: companies } = await q

    if (!companies || companies.length === 0) {
      setSearchResults([])
      setSearching(false)
      return
    }

    const ids = companies.map(c => c.id)
    const { data: catLinks } = await supabase
      .from('company_categories_b2c')
      .select('company_id, categories_b2c(name)')
      .in('company_id', ids)

    const catMap: Record<string, string[]> = {}
    ;(catLinks ?? []).forEach((row: any) => {
      if (!catMap[row.company_id]) catMap[row.company_id] = []
      if (row.categories_b2c?.name) catMap[row.company_id].push(row.categories_b2c.name)
    })

    setSearchResults(companies.map(c => ({ ...c, categories: catMap[c.id] ?? [] })))
    setSearching(false)
  }

  async function toggleFollow(companyId: string) {
    if (!userId) return
    if (followedIds.has(companyId)) {
      const { error } = await supabase.from('user_favorites').delete()
        .eq('user_id', userId).eq('company_id', companyId)
      if (error) { console.error('Unfollow error:', error); return }
      setFavorites(f => f.filter(c => c.id !== companyId))
    } else {
      const { error: insertErr } = await supabase
        .from('user_favorites')
        .insert({ user_id: userId, company_id: companyId })
      if (insertErr) { console.error('Follow error:', insertErr); return }
      const { data } = await supabase
        .from('companies')
        .select('id, public_name, logo_url, company_description, website')
        .eq('id', companyId).single()
      if (data) setFavorites(f => [...f, { ...data, categories: [] }])
    }
  }

  async function toggleJobNotify(companyId: string) {
    if (!userId) return
    const newVal = !jobNotify[companyId]
    const { error } = await supabase
      .from('user_favorites')
      .update({ notify_jobs: newVal })
      .eq('user_id', userId)
      .eq('company_id', companyId)
    if (!error) setJobNotify(prev => ({ ...prev, [companyId]: newVal }))
  }

  function onClickSearch() {
    handleSearch(searchName, searchCategory, searchCounty)
  }

  // Bygg kategorilista med underkategorier för dropdown
  const parentCats = allCategories.filter(c => c.parent_id === null)
  const subCatsFor = (pid: number) => allCategories.filter(c => c.parent_id === pid)

  if (loading) return <div className="py-20 text-center text-gray-400">Laddar...</div>

  return (
    <div className="max-w-4xl space-y-10">

      {/* ── Mina favoriter ─────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <h1 className="text-xl font-bold text-gray-900">Mina favoriter</h1>
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
            {favorites.length}
          </span>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
            <Star className="mx-auto mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-400">Du följer inga företag än. Sök nedan för att hitta företag.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {favorites.map(c => (
              <CompanyCard
                key={c.id}
                company={c}
                isFollowing
                notifyJobs={jobNotify[c.id] ?? false}
                onToggle={() => toggleFollow(c.id)}
                onToggleJobNotify={() => toggleJobNotify(c.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Hitta fler företag ─────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Hitta fler företag</h2>
        </div>

        <div className="card p-5 mb-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Företagsnamn</label>
              <input
                type="text"
                className="input-field"
                placeholder="Sök namn..."
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onClickSearch()}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Kategori</label>
              <select className="input-field" value={searchCategory}
                onChange={e => setSearchCategory(e.target.value)}>
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
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Län</label>
              <select className="input-field" value={searchCounty}
                onChange={e => setSearchCounty(e.target.value)}>
                <option value="">Alla län</option>
                {SWEDISH_COUNTIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={onClickSearch}
                disabled={searching}
                className="btn-primary w-full gap-2"
              >
                <Search className="h-4 w-4" />
                {searching ? 'Söker...' : 'Sök'}
              </button>
            </div>
          </div>
        </div>

        {searching ? (
          <div className="py-10 text-center text-sm text-gray-400">Laddar företag...</div>
        ) : searchResults.length === 0 ? (
          <div className="rounded-xl border border-gray-200 py-10 text-center text-sm text-gray-400">
            Inga företag matchade din sökning
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {searchResults.map(c => (
              <CompanyCard
                key={c.id}
                company={c}
                isFollowing={followedIds.has(c.id)}
                onToggle={() => toggleFollow(c.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CompanyCard({
  company,
  isFollowing,
  notifyJobs,
  onToggle,
  onToggleJobNotify,
}: {
  company: Company
  isFollowing: boolean
  notifyJobs?: boolean
  onToggle: () => void
  onToggleJobNotify?: () => void
}) {
  return (
    <div className="card p-4 flex gap-4">
      {company.logo_url ? (
        <img src={company.logo_url} alt="" className="h-14 w-14 flex-shrink-0 rounded-lg object-contain border border-gray-100" />
      ) : (
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <Building2 className="h-6 w-6 text-gray-400" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 leading-tight">{company.public_name}</p>
          <button
            onClick={onToggle}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
              isFollowing
                ? 'bg-yellow-100 text-yellow-700 hover:bg-red-50 hover:text-red-600'
                : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
            }`}
          >
            {isFollowing ? '★ Följer' : '+ Följ'}
          </button>
        </div>
        {isFollowing && onToggleJobNotify !== undefined && (
          <button
            onClick={onToggleJobNotify}
            title={notifyJobs ? 'Stäng av jobbannonser i Favoritreklam' : 'Visa jobbannonser i Favoritreklam'}
            className={`mt-2 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              notifyJobs
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <span>{notifyJobs ? '💼 Jobbannonser på' : '💼 Jobbannonser av'}</span>
          </button>
        )}

        {company.company_description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{company.company_description}</p>
        )}

        {company.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {company.categories.slice(0, 3).map(cat => (
              <span key={cat} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{cat}</span>
            ))}
          </div>
        )}

        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800"
            onClick={e => e.stopPropagation()}
          >
            <Globe className="h-3 w-3" /> Besök webbplats
          </a>
        )}
      </div>
    </div>
  )
}
