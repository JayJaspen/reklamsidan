export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdCard from '@/components/AdCard'
import { Star } from 'lucide-react'

export default async function B2CFavoritreklam() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: favs }, { data: discarded }] = await Promise.all([
    supabase.from('user_favorites').select('company_id, notify_jobs').eq('user_id', user.id),
    supabase.from('discarded_ads').select('ad_id').eq('user_id', user.id),
  ])

  const favIds       = (favs ?? []).map((f: any) => f.company_id as string)
  const jobNotifyIds = (favs ?? []).filter((f: any) => f.notify_jobs).map((f: any) => f.company_id as string)
  const discardedIds = (discarded ?? []).map((d: any) => d.ad_id as string)

  if (favIds.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" /> Favoritreklam
        </h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <Star className="mb-4 h-14 w-14 text-gray-200" />
          <h2 className="mb-2 text-lg font-semibold text-gray-400">Inga favoriter än</h2>
          <p className="text-sm text-gray-400 max-w-sm">
            Gå till fliken <strong>Favoriter</strong> och följ företag för att se deras erbjudanden här.
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
    .in('company_id', favIds)
    .order('valid_to')

  if (discardedIds.length > 0) {
    adQuery = adQuery.not('id', 'in', `(${discardedIds.join(',')})`)
  }

  const { data: ads } = await adQuery

  // Job listings from companies where user has enabled notify_jobs
  // Include description so users can read the full posting when expanded
  const { data: jobs } = jobNotifyIds.length > 0
    ? await supabase
        .from('jobs')
        .select('id, title, description, county, city, is_remote, salary_min, salary_max, salary_period, application_deadline, contact_email, application_url, companies(public_name, logo_url)')
        .eq('is_active', true)
        .in('company_id', jobNotifyIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" /> Favoritreklam
        </h1>
        <p className="text-sm text-gray-500">Reklam och jobbannonser från företag du följer</p>
      </div>

      {/* Ads */}
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

      {/* Job listings — only shown when user has opted in for ≥1 company */}
      {jobNotifyIds.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl">💼</span>
            <h2 className="text-lg font-bold text-gray-900">Jobbannonser från dina favoriter</h2>
          </div>

          {(!jobs || jobs.length === 0) ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
              Inga aktiva jobbannonser från dina valda favorit-företag just nu
            </div>
          ) : (
            <div className="space-y-3">
              {(jobs as any[]).map((job: any) => {
                const company  = job.companies?.[0]
                const location = job.is_remote
                  ? 'Distans'
                  : job.city ? `${job.city}, ${job.county}` : job.county

                return (
                  /* <details>/<summary> gives native expand/collapse without any JS */
                  <details key={job.id} className="card overflow-hidden group">
                    <summary className="p-4 flex items-center gap-4 cursor-pointer list-none select-none">
                      {/* Logo */}
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

                      {/* Title + meta */}
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

                      {/* Expand indicator */}
                      <span className="shrink-0 text-gray-400 text-xs whitespace-nowrap">Läs mer ▾</span>
                    </summary>

                    {/* Expanded: full description + contact/apply */}
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
    </div>
  )
}
