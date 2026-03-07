'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdCard from '@/components/AdCard'
import { Star } from 'lucide-react'

export default function B2BFavoritreklam() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasFavorites, setHasFavorites] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      const [{ data: favs }, { data: discarded }] = await Promise.all([
        supabase.from('user_favorites').select('company_id').eq('user_id', user.id),
        supabase.from('discarded_ads').select('ad_id').eq('user_id', user.id),
      ])

      const favIds = (favs ?? []).map((f: any) => f.company_id as string)
      const discardedIds = (discarded ?? []).map((d: any) => d.ad_id as string)

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

  if (!hasFavorites) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" /> Favoritreklam
        </h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <Star className="mb-4 h-14 w-14 text-gray-200" />
          <h2 className="mb-2 text-lg font-semibold text-gray-400">Inga favoriter än</h2>
          <p className="text-sm text-gray-400 max-w-sm">
            Gå till fliken <strong>Favoriter</strong> och följ leverantörer för att se deras erbjudanden här.
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
        <p className="text-sm text-gray-500">Reklam från leverantörer du följer</p>
      </div>
      {ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <p className="text-gray-400">Inga aktiva annonser från dina favorit-leverantörer just nu</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map(ad => (
            <AdCard key={ad.id} ad={ad} userId={userId ?? ''} tabSource={1} />
          ))}
        </div>
      )}
    </div>
  )
}
