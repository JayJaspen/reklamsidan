import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdCard from '@/components/AdCard'
import { Target } from 'lucide-react'

export default async function B2BIntresse() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Hämta användarens kategorier
  const { data: userCats } = await supabase
    .from('users_b2b_categories')
    .select('category_id')
    .eq('user_id', user.id)

  const catIds = (userCats ?? []).map(c => c.category_id)

  if (catIds.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="h-6 w-6 text-blue-500" /> Intressereklam
        </h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <Target className="mb-4 h-14 w-14 text-gray-200" />
          <h2 className="mb-2 text-lg font-semibold text-gray-400">Inga kategorier valda</h2>
          <p className="text-sm text-gray-400 max-w-sm">
            Gå till <strong>Min sida</strong> och välj kategorier du är intresserad av
            för att se relevant reklam här.
          </p>
        </div>
      </div>
    )
  }

  // Annonser vars kategorier matchar användarens intressen
  const { data: ads } = await supabase
    .from('active_ads')
    .select('*')
    .eq('ad_type', 'b2b')
    .in('id',
      supabase.from('ad_target_categories_b2b')
        .select('ad_id')
        .in('category_id', catIds)
    )
    .not('id', 'in',
      supabase.from('discarded_ads').select('ad_id').eq('user_id', user.id)
    )
    .order('valid_to')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="h-6 w-6 text-blue-500" /> Intressereklam
        </h1>
        <p className="text-sm text-gray-500">Reklam baserat på dina valda kategorier</p>
      </div>

      {(!ads || ads.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <p className="text-gray-400">Inga aktiva annonser matchar dina intressen just nu</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map(ad => (
            <AdCard key={ad.id} ad={ad} userId={user.id} tabSource={2} />
          ))}
        </div>
      )}
    </div>
  )
}
