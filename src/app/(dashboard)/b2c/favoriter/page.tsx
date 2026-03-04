'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, Search, X, Building2, Globe, ExternalLink } from 'lucide-react'
import { SWEDISH_COUNTIES } from '@/lib/utils'

type Company = {
  id: string
  public_name: string
  logo_url: string | null
  company_description: string | null
  website: string | null
  counties: string[] | null
  categories: string[]
}

export default function B2CFavoriter() {
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Mina favoriter
  const [favorites, setFavorites] = useState<Company[]>([])

  // Sökning – hitta nya företag
  const [searchName, setSearchName] = useState('')
  const [searchCategory, setSearchCategory] = useState('')
  const [searchCounty, setSearchCounty] = useState('')
  const [allCategories, setAllCategories] = useState<{ id: number; name: string }[]>([])
  const [searchResults, setSearchResults] = useState<Company[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Set av company-id:s som följs (för snabb lookup)
  const followedIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      await loadFavorites(user.id)
      await loadCategories()
      setLoading(false)
    })
  }, [])

  async function loadFavorites(uid: string) {
    const { data } = await supabase
      .from('user_favorites')
      .select('company_id')
      .eq('user_id', uid)

    if (!data || data.length === 0) { setFavorites([]); return }

    const ids = data.map(f => f.company_id)
    const { data: companies } = await supabase
      .from('companies')
      .select('id, public_name, logo_url, company_description, website, counties')
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
      .select('id, name')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('name')
    setAllCategories(data ?? [])
  }

  async function handleSearch() {
    if (!searchName && !searchCategory && !searchCounty) {
      setHasSearched(true)
      setSearchResults([])
      return
    }
    setSearching(true)
    setHasSearched(true)

    let companyIds: string[] | null = null

    // Om kategori vald – hämta matchande company_ids först
    if (searchCategory) {
      const catId = parseInt(searchCategory)
      const { data: catLinks } = await supabase
        .from('company_categories_b2c')
        .select('company_id')
        .eq('category_id', catId)
      companyIds = (catLinks ?? []).map((r: any) => r.company_id)
      if (companyIds.length === 0) {
        setSearchResults([])
        setSearching(false)
        return
      }
    }

    let q = supabase
      .from('companies')
      .select('id, public_name, logo_url, company_description, website, counties')
      .eq('is_active', true)
      .order('public_name')

    if (searchName) q = q.ilike('public_name', `%${searchName}%`)
    if (companyIds) q = q.in('id', companyIds)

    const { data: companies } = await q

    if (!companies || companies.length === 0) {
      setSearchResults([])
      setSearching(false)
      return
    }

    // Filtrera på län (client-side)
    const filtered = searchCounty
      ? companies.filter(c => (c.counties ?? []).includes(searchCounty))
      : companies

    if (filtered.length === 0) {
      setSearchResults([])
      setSearching(false)
      return
    }

    const ids = filtered.map(c => c.id)
    const { data: catLinks } = await supabase
      .from('company_categories_b2c')
      .select('company_id, categories_b2c(name)')
      .in('company_id', ids)

    const catMap: Record<string, string[]> = {}
    ;(catLinks ?? []).forEach((row: any) => {
      if (!catMap[row.company_id]) catMap[row.company_id] = []
      if (row.categories_b2c?.name) catMap[row.company_id].push(row.categories_b2c.name)
    })

    setSearchResults(filtered.map(c => ({ ...c, categories: catMap[c.id] ?? [] })))
    setSearching(false)
  }

  async function toggleFollow(companyId: string) {
    if (!userId) return
    if (followedIds.has(companyId)) {
      await supabase.from('user_favorites').delete()
        .eq('user_id', userId).eq('company_id', companyId)
      setFavorites(f => f.filter(c => c.id !== companyId))
    } else {
      await supabase.from('user_favorites').insert({ user_id: userId, company_id: companyId })
      // Hämta company-info och lägg till i favorites
      const { data } = await supabase
        .from('companies')
        .select('id, public_name, logo_url, company_description, website, counties')
        .eq('id', companyId).single()
      if (data) setFavorites(f => [...f, { ...data, categories: [] }])
    }
  }

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
                onToggle={() => toggleFollow(c.id)}
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
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Kategori</label>
              <select className="input-field" value={searchCategory}
                onChange={e => setSearchCategory(e.target.value)}>
                <option value="">Alla kategorier</option>
                {allCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                onClick={handleSearch}
                disabled={searching}
                className="btn-primary w-full gap-2"
              >
                <Search className="h-4 w-4" />
                {searching ? 'Söker...' : 'Sök'}
              </button>
            </div>
          </div>
        </div>

        {hasSearched && !searching && (
          searchResults.length === 0 ? (
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
          )
        )}
      </section>
    </div>
  )
}

function CompanyCard({
  company,
  isFollowing,
  onToggle,
}: {
  company: Company
  isFollowing: boolean
  onToggle: () => void
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
