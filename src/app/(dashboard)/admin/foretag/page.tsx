'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Download, Building2, X, Globe, Mail, Phone, MapPin, ShieldOff, ShieldCheck, AlertTriangle, Lock } from 'lucide-react'
import { SWEDISH_COUNTIES } from '@/lib/utils'

const SWEDISH_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.split('')

type CompanyResult = {
  id: string
  public_name: string
  registered_name: string
  org_number: string
  contact_person: string
  contact_email: string
  contact_phone: string
  website: string
  is_active: boolean
  is_mandatory_follow: boolean
  company_description: string | null
  sends_b2b: boolean
  logo_url: string | null
  billing_method: string | null
  billing_address: string | null
  billing_postal_code: string | null
  billing_city: string | null
  billing_email: string | null
}

export default function AdminForetag() {
  const supabase = createClient()

  const [filter, setFilter] = useState({ county: '', category: '' })
  const [results, setResults]     = useState<CompanyResult[]>([])
  const [searched, setSearched]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selected, setSelected]   = useState<CompanyResult | null>(null)
  const [categories, setCategories] = useState<{ id: number; name: string; parent_id: number | null; type: 'b2b' | 'b2c' }[]>([])
  const [confirmBlock, setConfirmBlock] = useState<CompanyResult | null>(null)
  const [togglingMandatory, setTogglingMandatory] = useState(false)
  const [selectedCountyNames, setSelectedCountyNames] = useState<string[]>([])
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const letterRefs = useRef<Record<string, HTMLTableRowElement | null>>({})

  // Bokstäver som faktiskt finns bland resultaten
  const availableLetters = new Set(
    results.map(c => c.public_name.charAt(0).toUpperCase())
  )

  function scrollToLetter(letter: string) {
    setActiveLetter(letter)
    const el = letterRefs.current[letter]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Load counties for selected company when modal opens
  useEffect(() => {
    if (!selected) { setSelectedCountyNames([]); return }
    supabase
      .from('company_counties')
      .select('county_id')
      .eq('company_id', selected.id)
      .then(({ data }) => {
        const ids = (data ?? []).map((r: any) => r.county_id as number)
        const names = ids.map(id => SWEDISH_COUNTIES[id - 1]).filter(Boolean)
        setSelectedCountyNames(names)
      })
  }, [selected])

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      const [{ data: b2bCats }, { data: b2cCats }] = await Promise.all([
        supabase.from('categories_b2b').select('id, name, parent_id').eq('is_active', true).order('name'),
        supabase.from('categories_b2c').select('id, name, parent_id').eq('is_active', true).order('name'),
      ])
      const all = [
        ...(b2bCats ?? []).map(c => ({ ...c, type: 'b2b' as const })),
        ...(b2cCats ?? []).map(c => ({ ...c, type: 'b2c' as const })),
      ]
      setCategories(all)
    }
    loadCategories()
  }, [])

  async function handleSearch() {
    setLoading(true)
    setSearched(true)
    setFetchError(null)

    // If category filter set, resolve matching company IDs
    let categoryCompanyIds: string[] | null = null
    if (filter.category) {
      const [typeStr, idStr] = filter.category.split(':')
      const catId = parseInt(idStr)
      const table = typeStr === 'b2b' ? 'categories_b2b' : 'categories_b2c'
      const linkTable = typeStr === 'b2b' ? 'company_categories_b2b' : 'company_categories_b2c'

      const { data: subCats } = await supabase
        .from(table)
        .select('id')
        .or(`id.eq.${catId},parent_id.eq.${catId}`)
        .eq('is_active', true)
      const catIds = (subCats ?? []).map(c => c.id)

      const { data: catLinks } = await supabase
        .from(linkTable)
        .select('company_id')
        .in('category_id', catIds)
      categoryCompanyIds = [...new Set((catLinks ?? []).map((r: any) => r.company_id as string))]
      if (categoryCompanyIds.length === 0) {
        setResults([])
        setLoading(false)
        return
      }
    }

    let q = supabase.from('companies').select('*').order('public_name')
    if (categoryCompanyIds) q = q.in('id', categoryCompanyIds)

    const { data, error } = await q

    if (error) {
      console.error('Supabase error:', error)
      setFetchError(`Databasfel: ${error.message} (code: ${error.code})`)
      setLoading(false)
      return
    }

    // Apply county filter via company_counties join table
    let filtered = (data ?? []) as CompanyResult[]
    if (filter.county) {
      const countyIdx = (SWEDISH_COUNTIES as readonly string[]).indexOf(filter.county)
      if (countyIdx >= 0) {
        const selectedCountyId = countyIdx + 1
        const allIds = filtered.map(c => c.id)
        const { data: countyRows } = await supabase
          .from('company_counties')
          .select('company_id, county_id')
          .in('company_id', allIds)
        const countyMap: Record<string, number[]> = {}
        ;(countyRows ?? []).forEach((r: any) => {
          if (!countyMap[r.company_id]) countyMap[r.company_id] = []
          countyMap[r.company_id].push(r.county_id)
        })
        filtered = filtered.filter(c => {
          const counties = countyMap[c.id]
          if (!counties || counties.length === 0) return true // rikstäckande
          return counties.includes(selectedCountyId)
        })
      }
    }

    setResults(filtered)
    setLoading(false)
  }

  async function toggleMandatory(id: string, current: boolean) {
    setTogglingMandatory(true)
    await supabase.from('companies').update({ is_mandatory_follow: !current }).eq('id', id)
    setResults(r => r.map(c => c.id === id ? { ...c, is_mandatory_follow: !current } : c))
    if (selected?.id === id) setSelected(s => s ? { ...s, is_mandatory_follow: !current } : s)
    setTogglingMandatory(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('companies').update({ is_active: !current }).eq('id', id)
    setResults(r => r.map(c => c.id === id ? { ...c, is_active: !current } : c))
    if (selected?.id === id) setSelected(s => s ? { ...s, is_active: !current } : s)
    setConfirmBlock(null)
  }

  function requestBlock(company: CompanyResult) {
    setConfirmBlock(company)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrerade annonsörföretag</h1>
          <p className="text-sm text-gray-500">Sök och hantera företag som skickar reklam</p>
        </div>
        {searched && (
          <button className="btn-secondary gap-2">
            <Download className="h-4 w-4" /> Exportera PDF
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card mb-6 p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Filtrering</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Hemmahörande län</label>
            <select className="input-field" value={filter.county}
              onChange={e => setFilter(f => ({ ...f, county: e.target.value }))}>
              <option value="">Alla län</option>
              {SWEDISH_COUNTIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Kategori</label>
            <select className="input-field" value={filter.category}
              onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
              <option value="">Alla kategorier</option>
              {(['b2b', 'b2c'] as const).map(type => {
                const parents = categories.filter(c => c.type === type && c.parent_id === null)
                if (parents.length === 0) return null
                return (
                  <optgroup key={type} label={type === 'b2b' ? '── B2B-kategorier ──' : '── B2C-kategorier ──'}>
                    {parents.map(parent => {
                      const subs = categories.filter(c => c.type === type && c.parent_id === parent.id)
                      if (subs.length > 0) {
                        return subs.map(sub => (
                          <option key={`${type}:${sub.id}`} value={`${type}:${sub.id}`}>{parent.name} › {sub.name}</option>
                        ))
                      }
                      return <option key={`${type}:${parent.id}`} value={`${type}:${parent.id}`}>{parent.name}</option>
                    })}
                  </optgroup>
                )
              })}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} disabled={loading} className="btn-primary w-full gap-2">
              <Search className="h-4 w-4" />
              {loading ? 'Söker...' : 'Sök'}
            </button>
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {!searched ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
          <Building2 className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">Välj filter och tryck på Sök</p>
        </div>
      ) : (
        <>
          {/* Alfabetsnavigation */}
          {results.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1">
              {SWEDISH_ALPHABET.map(letter => {
                const hasCompanies = availableLetters.has(letter)
                return (
                  <button
                    key={letter}
                    onClick={() => hasCompanies && scrollToLetter(letter)}
                    disabled={!hasCompanies}
                    className={`h-8 w-8 rounded-lg text-sm font-semibold transition ${
                      activeLetter === letter
                        ? 'bg-primary-600 text-white'
                        : hasCompanies
                        ? 'bg-white text-primary-600 border border-primary-200 hover:bg-primary-50'
                        : 'bg-gray-50 text-gray-300 cursor-default'
                    }`}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <span className="text-sm font-medium text-gray-700">{results.length} företag hittades</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Publikt namn</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Org.nr</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kontaktperson</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">E-post</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.map((c, i) => {
                    const letter = c.public_name.charAt(0).toUpperCase()
                    const prevLetter = i > 0 ? results[i - 1].public_name.charAt(0).toUpperCase() : null
                    const isNewLetter = letter !== prevLetter

                    return (
                      <>
                        {isNewLetter && (
                          <tr
                            key={`letter-${letter}`}
                            ref={el => { letterRefs.current[letter] = el }}
                          >
                            <td colSpan={6} className="bg-primary-50 px-6 py-2">
                              <span className="text-xs font-bold uppercase tracking-widest text-primary-600">{letter}</span>
                            </td>
                          </tr>
                        )}
                        <tr
                          key={c.id}
                          className="cursor-pointer hover:bg-primary-50/40 transition"
                          onClick={() => setSelected(c)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {c.logo_url && (
                                <img src={c.logo_url} alt="" className="h-8 w-8 rounded object-contain border border-gray-100" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{c.public_name}</p>
                                <p className="text-xs text-gray-400">{c.registered_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{c.org_number}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{c.contact_person}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{c.contact_email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {c.is_active ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                              {c.is_active ? 'Aktiv' : 'Spärrad'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {c.is_active ? (
                              <button
                                onClick={ev => { ev.stopPropagation(); requestBlock(c) }}
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                              >
                                Spärra konto
                              </button>
                            ) : (
                              <button
                                onClick={ev => { ev.stopPropagation(); toggleActive(c.id, c.is_active) }}
                                className="text-xs text-green-700 hover:text-green-900 font-medium"
                              >
                                Häv spärr
                              </button>
                            )}
                          </td>
                        </tr>
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Bekräftelsedialog för spärr */}
      {confirmBlock && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Spärra företagskonto?</h3>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">{confirmBlock.public_name}</span> kommer inte längre kunna publicera annonser. Du kan häva spärren när som helst.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmBlock(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => toggleActive(confirmBlock.id, confirmBlock.is_active)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                <ShieldOff className="h-4 w-4" /> Ja, spärra konto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 z-10">
              <div className="flex items-center gap-3">
                {selected.logo_url && (
                  <img src={selected.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain border border-gray-100" />
                )}
                <div>
                  <h2 className="font-bold text-gray-900">{selected.public_name}</h2>
                  <p className="text-xs text-gray-400">{selected.registered_name}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status + spärra/häv */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${selected.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selected.is_active ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                  {selected.is_active ? 'Aktiv' : 'Spärrad'}
                </span>
                {selected.is_active ? (
                  <button
                    onClick={() => requestBlock(selected)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <ShieldOff className="h-4 w-4" /> Spärra konto
                  </button>
                ) : (
                  <button
                    onClick={() => toggleActive(selected.id, selected.is_active)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" /> Häv spärr
                  </button>
                )}
              </div>

              {/* Basinfo */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Registreringsuppgifter</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-gray-400">Org.nummer</dt>
                    <dd className="text-sm font-medium text-gray-900">{selected.org_number || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Skickar B2B-reklam</dt>
                    <dd className="text-sm font-medium text-gray-900">{selected.sends_b2b ? 'Ja' : 'Nej'}</dd>
                  </div>
                </dl>
              </div>

              {/* Kontakt */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Kontaktuppgifter</h3>
                <div className="space-y-2">
                  {[
                    { icon: Phone, label: selected.contact_person, sub: 'Kontaktperson' },
                    { icon: Mail,  label: selected.contact_email,  sub: 'E-post' },
                    { icon: Phone, label: selected.contact_phone,  sub: 'Telefon' },
                    { icon: Globe, label: selected.website,        sub: 'Webbplats' },
                  ].map(({ icon: Icon, label, sub }) => label ? (
                    <div key={sub} className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">{label}</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Beskrivning */}
              {selected.company_description && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Beskrivning</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.company_description}</p>
                </div>
              )}

              {/* Län */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Verksamma Län</h3>
                {selectedCountyNames.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Rikstäckande (inga specifika län)</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCountyNames.map(c => (
                      <span key={c} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{c}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tvingande favorit */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Tvingande favorit</h3>
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Alla användare måste följa detta företag</p>
                    <p className="text-xs text-gray-500 mt-0.5">Automatisk favorit som inte kan avföljas av B2C/B2B-användare</p>
                  </div>
                  <button
                    onClick={() => toggleMandatory(selected.id, selected.is_mandatory_follow)}
                    disabled={togglingMandatory}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      selected.is_mandatory_follow
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    {selected.is_mandatory_follow ? 'Tvingande på' : 'Tvingande av'}
                  </button>
                </div>
              </div>

              {/* Fakturering */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Fakturering</h3>
                {selected.billing_method === 'email' ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" /> {selected.billing_email || '-'}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    <div>
                      <p>{selected.billing_address || '-'}</p>
                      <p>{selected.billing_postal_code} {selected.billing_city}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
