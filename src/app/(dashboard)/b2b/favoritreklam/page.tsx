'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdCard from '@/components/AdCard'
import { Star, Building2 } from 'lucide-react'

const B2B_TYPES = ['Lagerlokal', 'Butikslokal']

function matchesWatchlist(p: any, wl: any): boolean {
  if (wl.property_types.length > 0 && !wl.property_types.includes(p.property_type)) return false
  if (wl.listing_type && p.listing_type !== wl.listing_type) return false
  if (wl.county && p.county !== wl.county) return false
  if (wl.max_price != null && p.price != null && p.price > wl.max_price) return false
  return true
}

export default function B2BFavoritreklam() {
  const supabase = createClient()
  const [userId,            setUserId]            = useState<string | null>(null)
  const [ads,               setAds]               = useState<any[]>([])
  const [loading,           setLoading]           = useState(true)
  const [hasFavorites,      setHasFavorites]      = useState(true)
  const [matchedProperties, setMatchedProperties] = useState<any[]>([])
  const [watchlistCount,    setWatchlistCount]    = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      const [{ data: favs }, { data: discarded }, { data: watchlists }] = await Promise.all([
        supabase.from('user_favorites').select('company_id').eq('user_id', user.id),
        supabase.from('discarded_ads').select('ad_id').eq('user_id', user.id),
        supabase.from('property_watchlists').select('*').eq('user_id', user.id),
      ])

      const favIds       = (favs ?? []).map((f: any) => f.company_id as string)
      const discardedIds = (discarded ?? []).map((d: any) => d.ad_id as string)

      // Property watchlist matching
      if (watchlists && watchlists.length > 0) {
        setWatchlistCount(watchlists.length)
        const { data: allProps } = await supabase
          .from('properties')
          .select('id, company_id, property_type, listing_type, title, city, county, price, price_period, size_sqm, image_urls')
          .eq('is_active', true)
          .in('property_type', B2B_TYPES)
          .order('created_at', { ascending: false })

        const matchedIds = new Set<number>()
        for (const p of (allProps ?? [])) {
          for (const wl of watchlists) {
            if (matchesWatchlist(p, wl)) { matchedIds.add(p.id); break }
          }
        }
        setMatchedProperties((allProps ?? []).filter((p: any) => matchedIds.has(p.id)))
      }

      if (favIds.length === 0) {
        setHasFavorites(false)
        setLoading(false)
        return
      }

      const today = new Date().toISOString().slice(0, 10)
      let q = supabase
        .from('ads')
        .select('*, companies(public_name, logo_url)')
        .eq('ad_type', 'b2b')
        .in('company_id', favIds)
        .lte('valid_from', today)
        .gte('valid_to', today)
        .order('valid_to')

      if (discardedIds.length > 0) {
        q = q.not('id', 'in', `(${discardedIds.join(',')})`)
      }

      const { data: adsData } = await q

      const mapped = (adsData ?? []).map((a: any) => ({
        ...a,
        company_name: a.companies?.public_name ?? '',
        company_logo: a.companies?.logo_url ?? null,
      }))

      setAds(mapped)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="py-20 text-center text-gray-400">Laddar...</div>

  if (!hasFavorites && watchlistCount === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" /> Favoritreklam
        </h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <Star className="mb-4 h-14 w-14 text-gray-200" />
          <h2 className="mb-2 text-lg font-semibold text-gray-400">Inga favoriter än</h2>
          <p className="text-sm text-gray-400 max-w-sm">
            Gå till fliken <strong>Favoriter</strong> och följ leverantörer, eller skapa en <strong>bevakning</strong> i Fastighetsportalen.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" /> Favoritreklam
        </h1>
        <p className="text-sm text-gray-500">Reklam och bevakade fastigheter från dina favoriter</p>
      </div>

      {/* Ads */}
      {hasFavorites && (
        ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center mb-8">
            <p className="text-gray-400 text-sm">Inga aktiva annonser från dina favorit-leverantörer just nu</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {ads.map(ad => (
              <AdCard key={ad.id} ad={ad} userId={userId ?? ''} tabSource={1} />
            ))}
          </div>
        )
      )}

      {/* Property watchlist matches */}
      {watchlistCount > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900">Bevakade fastigheter</h2>
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
              {matchedProperties.length} träff{matchedProperties.length !== 1 ? 'ar' : ''}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Lokaler som matchar dina {watchlistCount} bevakning{watchlistCount !== 1 ? 'ar' : ''} i Fastighetsportalen
          </p>
          {matchedProperties.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
              Inga aktiva lokaler matchar dina bevakningar just nu
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
                        <Building2 className="h-6 w-6 text-gray-300" />
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
                      {p.size_sqm && <span>{p.size_sqm} kvm</span>}
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
