export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdCard from '@/components/AdCard'
import { Star, Home } from 'lucide-react'

const B2C_TYPES = ['Lägenhet', 'Villa', 'Radhus', 'Tomt']

function matchesWatchlist(p: any, wl: any): boolean {
  if (wl.property_types.length > 0 && !wl.property_types.includes(p.property_type)) return false
  if (wl.listing_type && p.listing_type !== wl.listing_type) return false
  if (wl.county && p.county !== wl.county) return false
  if (wl.max_price != null && p.price != null && p.price > wl.max_price) return false
  if (wl.max_monthly_fee != null && p.monthly_fee != null && p.monthly_fee > wl.max_monthly_fee) return false
  if (wl.min_rooms != null && (p.rooms == null || p.rooms < wl.min_rooms)) return false
  return true
}

export default async function B2CFavoritreklam() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: favs }, { data: discarded }, { data: watchlists }] = await Promise.all([
    supabase.from('user_favorites').select('company_id, notify_jobs').eq('user_id', user.id),
    supabase.from('discarded_ads').select('ad_id').eq('user_id', user.id),
    supabase.from('property_watchlists').select('*').eq('user_id', user.id),
  ])

  const favIds       = (favs ?? []).map((f: any) => f.company_id as string)
  const jobNotifyIds = (favs ?? []).filter((f: any) => f.notify_jobs).map((f: any) => f.company_id as string)
  const discardedIds = (discarded ?? []).map((d: any) => d.ad_id as string)

  if (favIds.length === 0 && (!watchlists || watchlists.length === 0)) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" /> Favoritreklam
        </h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <Star className="mb-4 h-14 w-14 text-gray-200" />
          <h2 className="mb-2 text-lg font-semibold text-gray-400">Inga favoriter än</h2>
          <p className="text-sm text-gray-400 max-w-sm">
            Gå till fliken <strong>Favoriter</strong> och följ företag, eller skapa en <strong>bevakning</strong> i Fastighetsportalen.
          </p>
        </div>
      </div>
    )
  }

  // Ads from all favourite companies
  let adQuery = supabase
    .from('active_ads')
    .select('*')
    .eq('ad_type', 'b2c')
    .in('company_id', favIds.length > 0 ? favIds : ['00000000-0000-0000-0000-000000000000'])
    .order('valid_to')

  if (discardedIds.length > 0) {
    adQuery = adQuery.not('id', 'in', `(${discardedIds.join(',')})`)
  }

  const { data: ads } = favIds.length > 0 ? await adQuery : { data: [] }

  // Job listings – two-step fetch to ensure company logos load correctly
  let jobsWithCompanies: any[] = []
  if (jobNotifyIds.length > 0) {
    const { data: jobRows } = await supabase
      .from('jobs')
      .select('id, company_id, title, description, county, city, is_remote, salary_min, salary_max, salary_period, application_deadline, contact_email, application_url')
      .eq('is_active', true)
      .in('company_id', jobNotifyIds)
      .order('created_at', { ascending: false })

    if (jobRows && jobRows.length > 0) {
      const cids = [...new Set((jobRows as any[]).map(j => j.company_id as string))]
      const { data: compData } = await supabase
        .from('companies')
        .select('id, public_name, logo_url')
        .in('id', cids)

      const cMap: Record<string, any> = {}
      ;(compData ?? []).forEach((c: any) => { cMap[c.id] = c })

      jobsWithCompanies = (jobRows as any[]).map(j => ({
        ...j,
        company: cMap[j.company_id] ?? null,
      }))
    }
  }

  // Property watchlist matches
  let matchedProperties: any[] = []
  if (watchlists && watchlists.length > 0) {
    const { data: allProps } = await supabase
      .from('properties')
      .select('id, company_id, property_type, listing_type, title, city, county, price, price_period, monthly_fee, size_sqm, rooms, image_urls, created_at')
      .eq('is_active', true)
      .in('property_type', B2C_TYPES)
      .order('created_at', { ascending: false })

    const matchedIds = new Set<number>()
    for (const p of (allProps ?? [])) {
      for (const wl of watchlists) {
        if (matchesWatchlist(p, wl)) { matchedIds.add(p.id); break }
      }
    }
    matchedProperties = (allProps ?? []).filter((p: any) => matchedIds.has(p.id))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" /> Favoritreklam
        </h1>
        <p className="text-sm text-gray-500">Reklam, jobbannonser och bevakade fastigheter från dina favoriter</p>
      </div>

      {/* Ads */}
      {favIds.length > 0 && (
        <>
          {(!ads || ads.length === 0) ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center mb-8">
              <p className="text-gray-400 text-sm">Inga aktiva annonser från dina favorit-företag just nu</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
              {ads.map((ad: any) => (
                <AdCard key={ad.id} ad={ad} userId={user.id} tabSource={1} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Job listings */}
      {jobNotifyIds.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl">💼</span>
            <h2 className="text-lg font-bold text-gray-900">Jobbannonser från dina favoriter</h2>
          </div>

          {jobsWithCompanies.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
              Inga aktiva jobbannonser från dina valda favorit-företag just nu
            </div>
          ) : (
            <div className="space-y-3">
              {jobsWithCompanies.map((job: any) => {
                const company  = job.company
                const location = job.is_remote
                  ? 'Distans'
                  : job.city ? `${job.city}, ${job.county}` : job.county

                return (
                  <details key={job.id} className="card overflow-hidden group">
                    <summary className="p-4 flex items-center gap-4 cursor-pointer list-none select-none">
                      {company?.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={company.public_name}
                          className="h-11 w-11 rounded-lg object-contain border border-gray-100 bg-white p-1 shrink-0"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-lg bg-gray-100 flex items-center justify-center text-base font-bold text-gray-400 shrink-0">
                          {company?.public_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{job.title}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                          {company?.public_name && (
                            <span className="font-medium text-gray-500">{company.public_name}</span>
                          )}
                          <span>•</span>
                          <span>{location}</span>
                          {(job.salary_min || job.salary_max) && (
                            <>
                              <span>•</span>
                              <span>
                                💰 {job.salary_min?.toLocaleString('sv-SE') ?? '?'}–{job.salary_max?.toLocaleString('sv-SE') ?? '?'} kr/{job.salary_period}
                              </span>
                            </>
                          )}
                          {job.application_deadline && (
                            <>
                              <span>•</span>
                              <span className="text-orange-500 font-medium">
                                📅 {new Date(job.application_deadline).toLocaleDateString('sv-SE')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-gray-400 text-xs whitespace-nowrap">Läs mer ▾</span>
                    </summary>
                    <div className="px-4 pb-4 border-t border-gray-100">
                      {job.description && (
                        <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap leading-relaxed">
                          {job.description}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-3 items-center">
                        {job.contact_email && (
                          <span className="text-xs text-gray-600">✉️ {job.contact_email}</span>
                        )}
                        {job.application_url && (
                          <a
                            href={job.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-xs py-1.5 px-4"
                          >
                            Ansök här
                          </a>
                        )}
                      </div>
                    </div>
                  </details>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Property watchlist matches */}
      {watchlists && watchlists.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Home className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900">Bevakade fastigheter</h2>
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
              {matchedProperties.length} träff{matchedProperties.length !== 1 ? 'ar' : ''}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Fastigheter som matchar dina {watchlists.length} bevakning{watchlists.length !== 1 ? 'ar' : ''} i Fastighetsportalen
          </p>

          {matchedProperties.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
              Inga aktiva fastigheter matchar dina bevakningar just nu – du notifieras här när det dyker upp något
            </div>
          ) : (
            <div className="space-y-3">
              {matchedProperties.map((p: any) => (
                <div key={p.id} className="card p-4 flex gap-4">
                  <div className="shrink-0 h-16 w-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                    {p.image_urls?.length > 0 ? (
                      <img src={p.image_urls[0]} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Home className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{p.title}</span>
                      <span className="badge badge-blue">{p.property_type}</span>
                      <span className={`badge ${p.listing_type === 'forsaljning' ? 'badge-green' : 'badge-yellow'}`}>
                        {p.listing_type === 'forsaljning' ? 'Försäljning' : 'Uthyrning'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{p.city} · {p.county}</p>
                    <div className="flex flex-wrap gap-x-3 text-xs text-gray-400 mt-0.5">
                      {p.price && (
                        <span className="font-semibold text-gray-800">
                          {p.price.toLocaleString('sv-SE')} kr{p.price_period ? ` / ${p.price_period}` : ''}
                        </span>
                      )}
                      {p.monthly_fee && <span>Avgift: {p.monthly_fee.toLocaleString('sv-SE')} kr/mån</span>}
                      {p.size_sqm && <span>{p.size_sqm} kvm</span>}
                      {p.rooms && <span>{p.rooms} rum</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
