'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Download, Users, TrendingUp } from 'lucide-react'

type Ad = {
  id: string
  name: string
  valid_from: string
  valid_to: string
  created_at: string
}

type FollowerStats = {
  total: number
  b2c: number
  b2b: number
}

type GenderDist = {
  man: number
  kvinna: number
  annat: number
}

type AgeDist = {
  [key: string]: number
}

type CountyDist = {
  [key: string]: number
}

export default function Statistics() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [ads, setAds] = useState<Ad[]>([])
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null)
  const [followers, setFollowers] = useState<FollowerStats>({ total: 0, b2c: 0, b2b: 0 })
  const [genderDist, setGenderDist] = useState<GenderDist>({ man: 0, kvinna: 0, annat: 0 })
  const [ageDist, setAgeDist] = useState<AgeDist>({})
  const [countyDist, setCountyDist] = useState<CountyDist>({})
  const [adReaders, setAdReaders] = useState<Array<{ user_id: string; read_at: string }>>([])
  const [loading, setLoading] = useState(true)
  const [adLoading, setAdLoading] = useState(false)
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('')
  const [selectedCountyFilter, setSelectedCountyFilter] = useState('')
  const [selectedAgeFilter, setSelectedAgeFilter] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      // Fetch all ads for this company
      const { data: adsData } = await supabase
        .from('ads')
        .select('id, name, valid_from, valid_to, created_at')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })

      if (adsData) {
        setAds(adsData)
        if (adsData.length > 0) {
          setSelectedAdId(adsData[0].id)
        }
      }

      // Fetch follower stats
      const { data: favoriteData } = await supabase
        .from('user_favorites')
        .select('user_id')
        .eq('company_id', user.id)

      const uniqueB2CFollowers = new Set()
      const uniqueB2BFollowers = new Set()

      if (favoriteData && favoriteData.length > 0) {
        for (const fav of favoriteData) {
          const { data: b2c } = await supabase
            .from('users_b2c')
            .select('id')
            .eq('id', fav.user_id)
            .single()

          if (b2c) {
            uniqueB2CFollowers.add(fav.user_id)
          } else {
            uniqueB2BFollowers.add(fav.user_id)
          }
        }
      }

      setFollowers({
        total: uniqueB2CFollowers.size + uniqueB2BFollowers.size,
        b2c: uniqueB2CFollowers.size,
        b2b: uniqueB2BFollowers.size,
      })

      // Fetch gender distribution for B2C followers
      if (uniqueB2CFollowers.size > 0) {
        const { data: genderData } = await supabase
          .from('users_b2c')
          .select('gender')
          .in('id', Array.from(uniqueB2CFollowers))

        const dist: GenderDist = { man: 0, kvinna: 0, annat: 0 }
        if (genderData) {
          genderData.forEach(u => {
            if (u.gender === 'man') dist.man++
            else if (u.gender === 'kvinna') dist.kvinna++
            else dist.annat++
          })
        }
        setGenderDist(dist)

        // Fetch age distribution for B2C followers
        const { data: ageData } = await supabase
          .from('users_b2c')
          .select('birth_year')
          .in('id', Array.from(uniqueB2CFollowers))

        const currentYear = new Date().getFullYear()
        const ageBuckets: AgeDist = {
          '18-25': 0,
          '26-35': 0,
          '36-45': 0,
          '46-55': 0,
          '56-65': 0,
          '65+': 0,
        }

        if (ageData) {
          ageData.forEach(u => {
            if (u.birth_year) {
              const age = currentYear - u.birth_year
              if (age >= 18 && age < 26) ageBuckets['18-25']++
              else if (age >= 26 && age < 36) ageBuckets['26-35']++
              else if (age >= 36 && age < 46) ageBuckets['36-45']++
              else if (age >= 46 && age < 56) ageBuckets['46-55']++
              else if (age >= 56 && age < 66) ageBuckets['56-65']++
              else if (age >= 66) ageBuckets['65+']++
            }
          })
        }
        setAgeDist(ageBuckets)
      }

      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedAdId || !userId) return

    setAdLoading(true)
    supabase
      .from('ad_reads')
      .select('user_id, read_at')
      .eq('ad_id', selectedAdId)
      .then(({ data }) => {
        setAdReaders(data ?? [])
        setAdLoading(false)
      })
  }, [selectedAdId])

  function handleExportPDF() {
    alert('PDF-export kommer snart!')
  }

  const selectedAd = ads.find(a => a.id === selectedAdId)

  if (loading) return <div className="py-20 text-center text-gray-400">Laddar statistik...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-blue-600" /> Statistik
        </h1>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-6 space-y-2">
          <p className="text-sm text-gray-500 font-medium">Totala följare</p>
          <p className="text-3xl font-bold text-gray-900">{followers.total}</p>
        </div>
        <div className="card p-6 space-y-2">
          <p className="text-sm text-gray-500 font-medium">B2C följare</p>
          <p className="text-3xl font-bold text-blue-600">{followers.b2c}</p>
        </div>
        <div className="card p-6 space-y-2">
          <p className="text-sm text-gray-500 font-medium">B2B följare</p>
          <p className="text-3xl font-bold text-green-600">{followers.b2b}</p>
        </div>
      </div>

      {/* Gender distribution */}
      {followers.b2c > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Könsfördelning (B2C)</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600">Man</p>
              <p className="text-2xl font-bold text-gray-900">{genderDist.man}</p>
              <p className="text-xs text-gray-400">
                {followers.b2c > 0 ? Math.round((genderDist.man / followers.b2c) * 100) : 0}%
              </p>
            </div>
            <div className="border-l-4 border-pink-500 pl-4">
              <p className="text-sm text-gray-600">Kvinna</p>
              <p className="text-2xl font-bold text-gray-900">{genderDist.kvinna}</p>
              <p className="text-xs text-gray-400">
                {followers.b2c > 0 ? Math.round((genderDist.kvinna / followers.b2c) * 100) : 0}%
              </p>
            </div>
            <div className="border-l-4 border-gray-500 pl-4">
              <p className="text-sm text-gray-600">Annat</p>
              <p className="text-2xl font-bold text-gray-900">{genderDist.annat}</p>
              <p className="text-xs text-gray-400">
                {followers.b2c > 0 ? Math.round((genderDist.annat / followers.b2c) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Age distribution */}
      {followers.b2c > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Åldersfördelning (B2C)</h2>
          <div className="space-y-2">
            {Object.entries(ageDist).map(([age, count]) => {
              const percent = followers.b2c > 0 ? Math.round((count / followers.b2c) * 100) : 0
              return (
                <div key={age} className="flex items-center gap-4">
                  <p className="w-12 text-sm font-medium text-gray-600">{age}</p>
                  <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-end pr-2"
                      style={{ width: `${percent * 3}%` }}
                    >
                      {percent > 5 && <span className="text-xs font-bold text-white">{count}</span>}
                    </div>
                  </div>
                  <p className="w-12 text-right text-sm text-gray-600">{percent}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Ad selection and reader stats */}
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Annonsläsning</h2>
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-600">Välj annons</label>
          <select
            className="input-field"
            value={selectedAdId || ''}
            onChange={e => setSelectedAdId(e.target.value)}
          >
            <option value="">-- Välj en annons --</option>
            {ads.map(ad => (
              <option key={ad.id} value={ad.id}>
                {ad.name} ({new Date(ad.created_at).toLocaleDateString('sv-SE')})
              </option>
            ))}
          </select>
        </div>

        {selectedAdId && selectedAd && (
          <div>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedAd.name}</h3>
                <p className="text-sm text-gray-500">
                  {adReaders.length} {adReaders.length === 1 ? 'läsare' : 'läsare'}
                </p>
              </div>
              <button
                onClick={handleExportPDF}
                className="btn-secondary gap-2"
              >
                <Download className="h-4 w-4" />
                Exportera PDF
              </button>
            </div>

            {adLoading ? (
              <p className="py-4 text-center text-gray-400">Laddar läsardata...</p>
            ) : adReaders.length === 0 ? (
              <p className="py-4 text-center text-gray-400">Ingen har läst denna annons än</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">Läsare</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">Läst</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adReaders.slice(0, 10).map((reader, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-2 text-gray-700">{reader.user_id.slice(0, 8)}...</td>
                        <td className="py-2 px-2 text-gray-600">
                          {new Date(reader.read_at).toLocaleDateString('sv-SE')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {adReaders.length > 10 && (
                  <p className="mt-2 text-xs text-gray-400">
                    + {adReaders.length - 10} fler läsare
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
