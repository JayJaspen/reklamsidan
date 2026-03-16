'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { JOB_COUNTIES } from '@/lib/utils'
import { ChevronDown, ChevronUp, Building2, X } from 'lucide-react'

const B2B_TYPES = ['Lagerlokal', 'Butikslokal'] as const

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
  size_sqm: number | null
  rooms: number | null
  build_year: number | null
  image_urls: string[]
  created_at: string
  companies: { public_name: string; logo_url: string | null }[] | null
}

export default function B2BFastighetsportal() {
  const supabase = createClient()

  const [properties,  setProperties]  = useState<Property[]>([])
  const [loading,     setLoading]     = useState(true)
  const [expandedId,  setExpandedId]  = useState<number | null>(null)
  const [imgIndex,    setImgIndex]    = useState<Record<number, number>>({})

  // Filter
  const [filterType,    setFilterType]    = useState('')
  const [filterListing, setFilterListing] = useState('')
  const [filterCounty,  setFilterCounty]  = useState('')

  useEffect(() => {
    async function load() {
      const { data: propData } = await supabase
        .from('properties')
        .select('id,company_id,property_type,listing_type,title,description,address,city,county,price,price_period,size_sqm,rooms,build_year,image_urls,created_at')
        .eq('is_active', true)
        .in('property_type', [...B2B_TYPES])
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
      }
      setLoading(false)
    }
    load()
  }, [])

  // Klientfiltrering
  const filtered = properties.filter(p => {
    if (filterType    && p.property_type !== filterType)    return false
    if (filterListing && p.listing_type  !== filterListing) return false
    if (filterCounty  && p.county        !== filterCounty)  return false
    return true
  })

  function clearFilters() {
    setFilterType('')
    setFilterListing('')
    setFilterCounty('')
  }

  const hasFilters = filterType || filterListing || filterCounty

  function prevImg(id: number, total: number) {
    setImgIndex(prev => ({ ...prev, [id]: ((prev[id] ?? 0) - 1 + total) % total }))
  }
  function nextImg(id: number, total: number) {
    setImgIndex(prev => ({ ...prev, [id]: ((prev[id] ?? 0) + 1) % total }))
  }

  if (loading) return <div className="py-20 text-center text-gray-400">Laddar...</div>

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fastighetsportal</h1>
        <p className="text-sm text-gray-500">Kommersiella lokaler till försäljning och uthyrning</p>
      </div>

      {/* Filter */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Typ</label>
            <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Alla typer</option>
              {B2B_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Annonstyp</label>
            <select className="input-field" value={filterListing} onChange={e => setFilterListing(e.target.value)}>
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
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">{filtered.length} annons{filtered.length !== 1 ? 'er' : ''}</span>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
              <X className="h-3.5 w-3.5" /> Rensa filter
            </button>
          )}
        </div>
      </div>

      {/* Annonslist */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
          <Building2 className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">
            {hasFilters ? 'Inga annonser matchar filtret.' : 'Inga lokalannonser just nu.'}
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
                  {/* Thumbnail */}
                  <div className="shrink-0 h-20 w-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                    {hasImgs ? (
                      <img src={p.image_urls[0]} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
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
                      {p.size_sqm   && <span>{p.size_sqm} kvm</span>}
                      {p.build_year && <span>Byggd {p.build_year}</span>}
                      {company?.public_name && <span className="font-medium text-gray-500">{company.public_name}</span>}
                    </div>
                  </div>

                  <div className="shrink-0 text-gray-400 self-center">
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                {/* Expanderad vy */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                    {/* Bildgalleri */}
                    {hasImgs && (
                      <div className="mb-4 relative rounded-xl overflow-hidden bg-gray-100" style={{ height: '240px' }}>
                        <img
                          src={p.image_urls[imgIdx]}
                          alt={`Bild ${imgIdx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {p.image_urls.length > 1 && (
                          <>
                            <button
                              onClick={e => { e.stopPropagation(); prevImg(p.id, p.image_urls.length) }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                            >‹</button>
                            <button
                              onClick={e => { e.stopPropagation(); nextImg(p.id, p.image_urls.length) }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                            >›</button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {p.image_urls.map((_, i) => (
                                <div key={i} className={`h-1.5 w-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Beskrivning */}
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-4">
                      {p.description}
                    </p>

                    {/* Detaljer */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4">
                      {p.address    && <div><span className="text-gray-400">Adress:</span> <span className="text-gray-700">{p.address}, {p.city}</span></div>}
                      {p.size_sqm   && <div><span className="text-gray-400">Yta:</span> <span className="text-gray-700">{p.size_sqm} kvm</span></div>}
                      {p.build_year && <div><span className="text-gray-400">Byggd:</span> <span className="text-gray-700">{p.build_year}</span></div>}
                      {p.price      && (
                        <div>
                          <span className="text-gray-400">Pris:</span>{' '}
                          <span className="font-semibold text-gray-900">
                            {p.price.toLocaleString('sv-SE')} kr{p.price_period ? ` / ${p.price_period}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Företag */}
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
    </div>
  )
}
