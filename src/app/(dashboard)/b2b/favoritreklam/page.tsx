import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdCard from '@/components/AdCard'
import { Star } from 'lucide-react'

export default async function B2BFavoritreklam() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: favs }, { data: discarded }] = await Promise.all([
    supabase.from('user_favorites').select('company_id').eq('user_id', user.id),
    supabase.from('discarded_ads').select('ad_id').eq('user_id', user.id),
  ])

  const favIds = (favs ?? []).map(f => f.company_id)
  const discardedIds = (discarded ?? []).map(d => d.ad_id)

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
            Gå till fliken <strong>Favoriter</strong> och följ leverantörer för att se deras erbjudanden här.
          </p>
        </div>
      </div>
    )
  }

  let query = supabase
    .from('active_ads')
    .select('*')
    .eq('ad_type', 'b2b')
    .in('company_id', favIds)
    .order('valid_to')

  if (discardedIds.length > 0) {
    query = query.not('id', 'in', `(${discardedIds.join(',')})`)
  }

  const { data: ads } = await query

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" /> Favoritreklam
        </h1>
        <p className="text-sm text-gray-500">Reklam från leverantörer du följer</p>
      </div>
      {(!ads || ads.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <p className="text-gray-400">Inga aktiva annonser från dina favorit-leverantörer just nu</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map(ad => (
            <AdCard key={ad.id} ad={ad} userId={user.id} tabSource={1} />
          ))}
        </div>
      )}
    </div>
  )
}
