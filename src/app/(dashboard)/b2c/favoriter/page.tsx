import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdCard from '@/components/AdCard'
import { Star } from 'lucide-react'

export default async function B2CFavoriter() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Hämta aktiva annonser från favorit-företag, exkl. slängda
  const { data: ads } = await supabase
    .from('active_ads')
    .select('*')
    .eq('ad_type', 'b2c')
    .in('company_id',
      supabase.from('user_favorites').select('company_id').eq('user_id', user.id)
    )
    .not('id', 'in',
      supabase.from('discarded_ads').select('ad_id').eq('user_id', user.id)
    )
    .order('valid_to')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" />
          Favoriter
        </h1>
        <p className="text-sm text-gray-500">Reklam från företag du följer</p>
      </div>

      {(!ads || ads.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <Star className="mb-4 h-14 w-14 text-gray-200" />
          <h2 className="mb-2 text-lg font-semibold text-gray-400">Inga favoriter än</h2>
          <p className="text-sm text-gray-400 max-w-sm">
            Gå till fliken <strong>All reklam</strong> och favoritmarkera företag
            för att se deras erbjudanden här.
          </p>
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
