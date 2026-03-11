'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { JOB_COUNTIES, CITIES_BY_COUNTY } from '@/lib/utils'
import { Loader2, X, ChevronDown, ChevronUp, Search } from 'lucide-react'

type JobCategory = { id: number; name: string }

type Job = {
  id: number
  title: string
  description: string
  category_id: number
  county: string | null
  city: string | null
  is_remote: boolean
  salary_min: number | null
  salary_max: number | null
  salary_period: string
  contact_email: string | null
  application_url: string | null
  application_deadline: string | null
  created_at: string
  companies: { public_name: string; logo_url: string | null }[] | null
}

export default function B2CJobbmarknad() {
  const supabase = createClient()

  const [categories, setCategories] = useState<JobCategory[]>([])
  const [jobs, setJobs]             = useState<Job[]>([])
  const [loading, setLoading]       = useState(true)
  const [searching, setSearching]   = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Filters
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCounty,   setFilterCounty]   = useState('')
  const [filterCity,     setFilterCity]     = useState('')

  const availableCities = filterCounty ? (CITIES_BY_COUNTY[filterCounty] ?? []) : []

  const fetchJobs = useCallback(async () => {
    setSearching(true)
    setHasSearched(true)
    setExpandedId(null)
    let query = supabase
      .from('jobs')
      .select('id,title,description,category_id,county,city,is_remote,salary_min,salary_max,salary_period,contact_email,application_url,application_deadline,created_at,companies(public_name,logo_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (filterCategory) query = query.eq('category_id', parseInt(filterCategory))
    if (filterCounty)   query = query.or(`county.eq.${filterCounty},is_remote.eq.true`)
    if (filterCity)     query = query.eq('city', filterCity)

    const { data } = await query
    setJobs((data ?? []) as Job[])
    setSearching(false)
  }, [filterCategory, filterCounty, filterCity])

  useEffect(() => {
    supabase.from('job_categories').select('id,name').order('sort_order').then(({ data }) => {
      if (data) setCategories(data)
      setLoading(false)
    })
  }, [])

  function clearFilters() {
    setFilterCategory('')
    setFilterCounty('')
    setFilterCity('')
  }

  const hasFilters = filterCategory || filterCounty || filterCity
  const catName = (id: number) => categories.find(c => c.id === id)?.name ?? ''

  if (loading) return <div className="py-20 text-center text-gray-400">Laddar...</div>

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobbmarknad</h1>
        <p className="text-sm text-gray-500">Filtrera och hitta jobbannonser från företag</p>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Kategori</label>
            <select
              className="input-field"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">Alla kategorier</option>
              {categories.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Län</label>
            <select
              className="input-field"
              value={filterCounty}
              onChange={e => { setFilterCounty(e.target.value); setFilterCity('') }}
            >
              <option value="">Alla län</option>
              {JOB_COUNTIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Stad</label>
            <select
              className="input-field"
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              disabled={!filterCounty}
            >
              <option value="">Alla städer</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={fetchJobs}
            disabled={searching}
            className="btn-primary gap-2"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {searching ? 'Söker...' : 'Sök jobb'}
          </button>
          {hasSearched && hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition"
            >
              <X className="h-3.5 w-3.5" /> Rensa filter
            </button>
          )}
          {hasSearched && (
            <span className="text-xs text-gray-400">{jobs.length} annons{jobs.length !== 1 ? 'er' : ''}</span>
          )}
        </div>
      </div>

      {/* Job list */}
      {!hasSearched ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
          <Search className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">Välj filter och klicka på "Sök jobb" för att se annonser</p>
        </div>
      ) : searching ? (
        <div className="py-12 text-center text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Söker...
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-base font-semibold text-gray-700">Inga annonser hittades</p>
          <p className="text-sm text-gray-500 mt-1">
            {hasFilters ? 'Prova att ändra dina filter.' : 'Det finns inga aktiva jobbannonser just nu.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const company  = job.companies?.[0]
            const isOpen   = expandedId === job.id
            const location = job.is_remote
              ? 'Distans'
              : job.city
                ? `${job.city}, ${job.county}`
                : job.county ?? ''

            return (
              <div key={job.id} className="card overflow-hidden">
                {/* Summary row — always visible, click to expand */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : job.id)}
                  className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-50 transition"
                >
                  {/* Company logo */}
                  <div className="shrink-0">
                    {company?.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.public_name}
                        className="h-12 w-12 rounded-lg object-contain border border-gray-100 bg-white p-1"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-400">
                        {company?.public_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{job.title}</span>
                      <span className="badge badge-blue">{catName(job.category_id)}</span>
                      {job.is_remote
                        ? <span className="badge badge-green">Distans</span>
                        : <span className="badge badge-yellow">{location}</span>
                      }
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                      {company?.public_name && <span className="font-medium text-gray-500">{company.public_name}</span>}
                      {(job.salary_min || job.salary_max) && (
                        <span className="text-gray-500">
                          💰 {job.salary_min ? job.salary_min.toLocaleString('sv-SE') : '?'}–{job.salary_max ? job.salary_max.toLocaleString('sv-SE') : '?'} kr/{job.salary_period}
                        </span>
                      )}
                      {job.application_deadline && (
                        <span className="text-orange-500 font-medium">
                          📅 Sista dag: {new Date(job.application_deadline).toLocaleDateString('sv-SE')}
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(job.created_at).toLocaleDateString('sv-SE')}</span>
                    </div>
                  </div>

                  {/* Expand indicator */}
                  <div className="shrink-0 text-gray-400">
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-4">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      {job.contact_email && (
                        <span className="text-sm text-gray-700">
                          ✉️ <span className="font-medium">{job.contact_email}</span>
                        </span>
                      )}
                      {job.application_url && (
                        <a
                          href={job.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-xs py-1.5 px-4"
                        >
                          🔗 Ansök här
                        </a>
                      )}
                    </div>
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
