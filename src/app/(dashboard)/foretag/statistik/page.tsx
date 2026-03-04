'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Download, Users, TrendingUp, Check } from 'lucide-react'
import { SWEDISH_COUNTIES } from '@/lib/utils'

type Ad = {
  id: string
  name: string
  ad_type: string
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

type ReaderDetail = {
  user_id: string
  read_at: string
  user_type: 'b2c' | 'b2b' | 'unknown'
  gender?: string
  age_group?: string
  county?: string
  is_follower: boolean
  cost: number
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
  const [countyDistB2C, setCountyDistB2C] = useState<CountyDist>({})
  const [countyDistB2B, setCountyDistB2B] = useState<CountyDist>({})
  const [b2bFollowerCompanies, setB2bFollowerCompanies] = useState<string[]>([])
  const [followerIdArray, setFollowerIdArray] = useState<string[]>([])
  const [adReaderDetails, setAdReaderDetails] = useState<ReaderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [adDetailLoading, setAdDetailLoading] = useState(false)
  const [adFilterGender, setAdFilterGender] = useState('')
  const [adFilterAge, setAdFilterAge] = useState('')
  const [adFilterCounty, setAdFilterCounty] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      // Fetch all ads for this company
      const { data: adsData } = await supabase
        .from('ads')
        .select('id, name, ad_type, valid_from, valid_to, created_at')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })

      if (adsData) {
        setAds(adsData)
        if (adsData.length > 0) {
          setSelectedAdId(adsData[0].id)
        }
      }

      // Fetch follower stats – hämta alla user_ids, sedan profiler i en query
      const { data: favoriteData } = await supabase
        .from('user_favorites')
        .select('user_id')
        .eq('company_id', user.id)

      const followerIds = (favoriteData ?? []).map(f => f.user_id)
      const uniqueB2CFollowers = new Set<string>()
      const uniqueB2BFollowers = new Set<string>()

      if (followerIds.length > 0) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('id, user_type')
          .in('id', followerIds)

        if (profileData) {
          profileData.forEach(p => {
            if (p.user_type === 'b2c') uniqueB2CFollowers.add(p.id)
            else if (p.user_type === 'b2b') uniqueB2BFollowers.add(p.id)
          })
        }
      }

      setFollowers({
        total: uniqueB2CFollowers.size + uniqueB2BFollowers.size,
        b2c: uniqueB2CFollowers.size,
        b2b: uniqueB2BFollowers.size,
      })
      setFollowerIdArray([...Array.from(uniqueB2CFollowers), ...Array.from(uniqueB2BFollowers)])

      // Fetch gender + county distribution for B2C followers
      if (uniqueB2CFollowers.size > 0) {
        const { data: genderData } = await supabase
          .from('users_b2c')
          .select('gender, county_id')
          .in('id', Array.from(uniqueB2CFollowers))

        const dist: GenderDist = { man: 0, kvinna: 0, annat: 0 }
        const cDist: CountyDist = {}
        if (genderData) {
          genderData.forEach(u => {
            if (u.gender === 'man') dist.man++
            else if (u.gender === 'kvinna') dist.kvinna++
            else dist.annat++
            if (u.county_id) {
              const name = SWEDISH_COUNTIES[u.county_id - 1] as string ?? 'Okänt'
              cDist[name] = (cDist[name] ?? 0) + 1
            }
          })
        }
        setGenderDist(dist)
        setCountyDistB2C(cDist)

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

      // Fetch B2B follower company names + county distribution
      if (uniqueB2BFollowers.size > 0) {
        const { data: b2bData } = await supabase
          .from('users_b2b')
          .select('company_name, county_id')
          .in('id', Array.from(uniqueB2BFollowers))

        if (b2bData) {
          setB2bFollowerCompanies(b2bData.map(u => u.company_name).filter(Boolean))
          const b2bCDist: CountyDist = {}
          b2bData.forEach(u => {
            if (u.county_id) {
              const name = SWEDISH_COUNTIES[u.county_id - 1] as string ?? 'Okänt'
              b2bCDist[name] = (b2bCDist[name] ?? 0) + 1
            }
          })
          setCountyDistB2B(b2bCDist)
        }
      }

      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedAdId || !userId) return
    setAdDetailLoading(true)
    setAdReaderDetails([])

    async function loadReaderDetails() {
      const { data: reads } = await supabase
        .from('ad_reads')
        .select('user_id, read_at')
        .eq('ad_id', selectedAdId)

      if (!reads || reads.length === 0) {
        setAdReaderDetails([])
        setAdDetailLoading(false)
        return
      }

      const readerIds = reads.map(r => r.user_id)
      const followerSet = new Set(followerIdArray)

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, user_type')
        .in('id', readerIds)
      const profileMap = new Map(profiles?.map(p => [p.id, p.user_type]) ?? [])

      const b2cIds = readerIds.filter(id => profileMap.get(id) === 'b2c')
      const b2cMap = new Map<string, { gender: string; age_group: string; county: string }>()
      if (b2cIds.length > 0) {
        const { data: b2cData } = await supabase
          .from('users_b2c')
          .select('id, gender, birth_year, county_id')
          .in('id', b2cIds)
        const currentYear = new Date().getFullYear()
        b2cData?.forEach(u => {
          const age = currentYear - (u.birth_year ?? 0)
          let age_group = ''
          if (age >= 18 && age < 26) age_group = '18-25'
          else if (age >= 26 && age < 36) age_group = '26-35'
          else if (age >= 36 && age < 46) age_group = '36-45'
          else if (age >= 46 && age < 56) age_group = '46-55'
          else if (age >= 56 && age < 66) age_group = '56-65'
          else if (age >= 66) age_group = '65+'
          b2cMap.set(u.id, {
            gender: u.gender ?? '',
            age_group,
            county: u.county_id ? (SWEDISH_COUNTIES[u.county_id - 1] ?? '') : '',
          })
        })
      }

      const b2bIds = readerIds.filter(id => profileMap.get(id) === 'b2b')
      const b2bMap = new Map<string, { county: string }>()
      if (b2bIds.length > 0) {
        const { data: b2bData } = await supabase
          .from('users_b2b')
          .select('id, county_id')
          .in('id', b2bIds)
        b2bData?.forEach(u => {
          b2bMap.set(u.id, {
            county: u.county_id ? (SWEDISH_COUNTIES[u.county_id - 1] ?? '') : '',
          })
        })
      }

      const selectedAdObj = ads.find(a => a.id === selectedAdId)
      const adType = selectedAdObj?.ad_type ?? 'b2c'

      const details: ReaderDetail[] = reads.map(read => {
        const userType = (profileMap.get(read.user_id) ?? 'unknown') as 'b2c' | 'b2b' | 'unknown'
        const isFollower = followerSet.has(read.user_id)
        let cost = 0
        if (adType === 'b2c') cost = isFollower ? 3 : 1
        else if (adType === 'b2b') cost = isFollower ? 5 : 3
        const b2cInfo = b2cMap.get(read.user_id)
        const b2bInfo = b2bMap.get(read.user_id)
        return {
          user_id: read.user_id,
          read_at: read.read_at,
          user_type: userType,
          gender: b2cInfo?.gender,
          age_group: b2cInfo?.age_group,
          county: b2cInfo?.county ?? b2bInfo?.county,
          is_follower: isFollower,
          cost,
        }
      })

      setAdReaderDetails(details)
      setAdDetailLoading(false)
    }

    loadReaderDetails()
  }, [selectedAdId, followerIdArray])

  function handleExportPDF() {
    if (!selectedAd) return
    const totalReads = adReaderDetails.length
    const followerReads = adReaderDetails.filter(r => r.is_follower).length
    const generalReads = adReaderDetails.filter(r => !r.is_follower).length
    const totalCost = adReaderDetails.reduce((s, r) => s + r.cost, 0)

    // Gender distribution among readers
    const genderCount: Record<string, number> = {}
    adReaderDetails.forEach(r => { if (r.gender) genderCount[r.gender] = (genderCount[r.gender] ?? 0) + 1 })
    // Age distribution among readers
    const ageCount: Record<string, number> = {}
    adReaderDetails.forEach(r => { if (r.age_group) ageCount[r.age_group] = (ageCount[r.age_group] ?? 0) + 1 })
    // County distribution among readers
    const countyCount: Record<string, number> = {}
    adReaderDetails.forEach(r => { if (r.county) countyCount[r.county] = (countyCount[r.county] ?? 0) + 1 })

    const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <title>Annonsrapport – ${selectedAd.name}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 32px; font-size: 13px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    h2 { font-size: 14px; margin: 18px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .meta { color: #555; font-size: 12px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; }
    .card .label { font-size: 11px; color: #666; }
    .card .value { font-size: 20px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 11px; text-transform: uppercase; }
    td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
    .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .bar-label { width: 100px; font-size: 12px; }
    .bar-bg { flex: 1; background: #e5e7eb; height: 14px; border-radius: 4px; overflow: hidden; }
    .bar-fill { background: #3b82f6; height: 100%; }
    .bar-val { width: 80px; text-align: right; font-size: 12px; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>Annonsrapport: ${selectedAd.name}</h1>
  <p class="meta">
    Typ: ${selectedAd.ad_type?.toUpperCase() ?? '–'} &nbsp;|&nbsp;
    Aktiv: ${selectedAd.valid_from ? new Date(selectedAd.valid_from).toLocaleDateString('sv-SE') : '–'} – ${selectedAd.valid_to ? new Date(selectedAd.valid_to).toLocaleDateString('sv-SE') : '–'} &nbsp;|&nbsp;
    Kostnadsgräns: ${(selectedAd as any).cost_limit ? (selectedAd as any).cost_limit + ' kr' : 'Ingen'}
  </p>

  <h2>Sammanfattning</h2>
  <div class="grid">
    <div class="card"><div class="label">Totala läsningar</div><div class="value">${totalReads}</div></div>
    <div class="card"><div class="label">Total kostnad</div><div class="value">${totalCost} kr</div></div>
    <div class="card"><div class="label">Följarläsningar</div><div class="value">${followerReads}</div></div>
    <div class="card"><div class="label">Generella läsningar</div><div class="value">${generalReads}</div></div>
  </div>

  ${Object.keys(genderCount).length > 0 ? `
  <h2>Könsfördelning</h2>
  ${Object.entries(genderCount).sort((a,b) => b[1]-a[1]).map(([g, n]) => {
    const pct = totalReads > 0 ? Math.round(n/totalReads*100) : 0
    return `<div class="bar-row"><div class="bar-label">${g.charAt(0).toUpperCase()+g.slice(1)}</div><div class="bar-bg"><div class="bar-fill" style="width:${pct*3}%;max-width:100%"></div></div><div class="bar-val">${n} st (${pct}%)</div></div>`
  }).join('')}` : ''}

  ${Object.keys(ageCount).length > 0 ? `
  <h2>Åldersfördelning</h2>
  ${Object.entries(ageCount).map(([a, n]) => {
    const pct = totalReads > 0 ? Math.round(n/totalReads*100) : 0
    return `<div class="bar-row"><div class="bar-label">${a}</div><div class="bar-bg"><div class="bar-fill" style="width:${pct*3}%;max-width:100%"></div></div><div class="bar-val">${n} st (${pct}%)</div></div>`
  }).join('')}` : ''}

  ${Object.keys(countyCount).length > 0 ? `
  <h2>Länsfördelning</h2>
  ${Object.entries(countyCount).sort((a,b)=>b[1]-a[1]).map(([c, n]) => {
    const pct = totalReads > 0 ? Math.round(n/totalReads*100) : 0
    return `<div class="bar-row"><div class="bar-label" style="width:140px">${c}</div><div class="bar-bg"><div class="bar-fill" style="width:${pct*3}%;max-width:100%"></div></div><div class="bar-val">${n} st (${pct}%)</div></div>`
  }).join('')}` : ''}

  <p style="margin-top:24px;font-size:11px;color:#888;">Rapport genererad ${new Date().toLocaleDateString('sv-SE')} – Reklamsidan</p>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
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

      {/* Pricing */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">Prislista</h2>
        <p className="mb-5 text-xs text-gray-400">Du debiteras per unik läsning. Max en debitering per användare och annons.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: 'B2C-reklam',
              subtitle: 'Reklam till privatpersoner',
              color: 'border-green-200 bg-white',
              accent: 'text-green-700',
              items: [
                { label: 'Favorit- & intressereklam', price: '3 kr/läsning' },
                { label: 'Generell reklam', price: '1 kr/läsning' },
              ],
            },
            {
              title: 'B2B-reklam',
              subtitle: 'Reklam till mottagarföretag',
              color: 'border-purple-200 bg-white',
              accent: 'text-purple-700',
              items: [
                { label: 'Favorit- & intressereklam', price: '5 kr/läsning' },
                { label: 'Generell reklam', price: '3 kr/läsning' },
              ],
            },
          ].map(({ title, subtitle, color, accent, items }) => (
            <div key={title} className={`rounded-xl border p-5 ${color}`}>
              <p className={`mb-0.5 font-semibold ${accent}`}>{title}</p>
              <p className="mb-4 text-xs text-gray-400">{subtitle}</p>
              <div className="space-y-2">
                {items.map(({ label, price }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Check className="h-3.5 w-3.5 text-green-500" /> {label}
                    </span>
                    <span className="font-bold text-gray-900">{price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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

      {/* County distribution B2C */}
      {Object.keys(countyDistB2C).length > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Länsfördelning (B2C)</h2>
          <div className="space-y-2">
            {Object.entries(countyDistB2C)
              .sort((a, b) => b[1] - a[1])
              .map(([county, count]) => {
                const percent = followers.b2c > 0 ? Math.round((count / followers.b2c) * 100) : 0
                return (
                  <div key={county} className="flex items-center gap-4">
                    <p className="w-40 truncate text-sm text-gray-600">{county}</p>
                    <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-300 to-blue-500"
                        style={{ width: `${Math.max(percent * 3, 4)}%` }}
                      />
                    </div>
                    <p className="w-28 text-right text-sm text-gray-700 font-medium">{count} st ({percent}%)</p>
                  </div>
                )
              })}
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
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: `${percent * 3}%` }}
                    />
                  </div>
                  <p className="w-28 text-right text-sm text-gray-700 font-medium">{count} st ({percent}%)</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* B2B follower companies */}
      {b2bFollowerCompanies.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            B2B-följare ({b2bFollowerCompanies.length} företag)
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {b2bFollowerCompanies.sort().map((name, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-400" />
                <span className="text-sm font-medium text-gray-700">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* County distribution B2B */}
      {Object.keys(countyDistB2B).length > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Länsfördelning (B2B)</h2>
          <div className="space-y-2">
            {Object.entries(countyDistB2B)
              .sort((a, b) => b[1] - a[1])
              .map(([county, count]) => {
                const percent = followers.b2b > 0 ? Math.round((count / followers.b2b) * 100) : 0
                return (
                  <div key={county} className="flex items-center gap-4">
                    <p className="w-40 truncate text-sm text-gray-600">{county}</p>
                    <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-300 to-green-500"
                        style={{ width: `${Math.max(percent * 3, 4)}%` }}
                      />
                    </div>
                    <p className="w-28 text-right text-sm text-gray-700 font-medium">{count} st ({percent}%)</p>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Ad selection and reader stats */}
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Annonshistorik</h2>
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-600">Välj annons</label>
          <select
            className="input-field"
            value={selectedAdId || ''}
            onChange={e => { setSelectedAdId(e.target.value); setAdFilterGender(''); setAdFilterAge(''); setAdFilterCounty('') }}
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
          <div className="space-y-6">
            {!adDetailLoading && adReaderDetails.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
                >
                  <Download className="h-4 w-4" /> Exportera PDF-rapport
                </button>
              </div>
            )}
            {adDetailLoading ? (
              <p className="py-6 text-center text-gray-400">Laddar annonsdata...</p>
            ) : (() => {
              const totalCost = adReaderDetails.reduce((s, r) => s + r.cost, 0)
              const filteredDetails = adReaderDetails.filter(r => {
                if (adFilterGender && r.gender !== adFilterGender) return false
                if (adFilterAge && r.age_group !== adFilterAge) return false
                if (adFilterCounty && r.county !== adFilterCounty) return false
                return true
              })
              const filteredCost = filteredDetails.reduce((s, r) => s + r.cost, 0)
              const hasFilters = adFilterGender || adFilterAge || adFilterCounty
              return (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                      <p className="text-xs text-blue-600 font-medium">Totala läsningar</p>
                      <p className="text-2xl font-bold text-blue-900">{adReaderDetails.length}</p>
                    </div>
                    <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                      <p className="text-xs text-green-600 font-medium">Total kostnad</p>
                      <p className="text-2xl font-bold text-green-900">{totalCost} kr</p>
                    </div>
                    <div className="rounded-xl bg-purple-50 border border-purple-100 p-4">
                      <p className="text-xs text-purple-600 font-medium">Följarläsningar</p>
                      <p className="text-2xl font-bold text-purple-900">{adReaderDetails.filter(r => r.is_follower).length}</p>
                    </div>
                    <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                      <p className="text-xs text-orange-600 font-medium">Generella läsningar</p>
                      <p className="text-2xl font-bold text-orange-900">{adReaderDetails.filter(r => !r.is_follower).length}</p>
                    </div>
                  </div>

                  {/* Filters (B2C ads only) */}
                  {adReaderDetails.some(r => r.user_type === 'b2c') && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-gray-700">Filtrera läsare</p>
                      <div className="flex flex-wrap gap-3 items-center">
                        <select className="input-field w-auto text-sm py-1.5" value={adFilterGender} onChange={e => setAdFilterGender(e.target.value)}>
                          <option value="">Alla kön</option>
                          <option value="man">Man</option>
                          <option value="kvinna">Kvinna</option>
                          <option value="annat">Annat</option>
                        </select>
                        <select className="input-field w-auto text-sm py-1.5" value={adFilterAge} onChange={e => setAdFilterAge(e.target.value)}>
                          <option value="">Alla åldrar</option>
                          {['18-25','26-35','36-45','46-55','56-65','65+'].map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select className="input-field w-auto text-sm py-1.5" value={adFilterCounty} onChange={e => setAdFilterCounty(e.target.value)}>
                          <option value="">Alla län</option>
                          {[...new Set(adReaderDetails.map(r => r.county).filter(Boolean))].sort().map(c => <option key={c} value={c as string}>{c}</option>)}
                        </select>
                        {hasFilters && (
                          <button onClick={() => { setAdFilterGender(''); setAdFilterAge(''); setAdFilterCounty('') }} className="text-xs text-gray-500 hover:text-gray-700 underline">
                            Rensa filter
                          </button>
                        )}
                      </div>
                      {hasFilters && (
                        <p className="mt-2 text-sm text-gray-500">
                          {filteredDetails.length} av {adReaderDetails.length} läsare &middot; Filtrerad kostnad: <span className="font-semibold text-gray-700">{filteredCost} kr</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Readers table */}
                  {adReaderDetails.length === 0 ? (
                    <p className="py-4 text-center text-gray-400">Ingen har läst denna annons än</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50 text-left">
                            <th className="py-2 px-3 font-semibold text-gray-600">Typ</th>
                            <th className="py-2 px-3 font-semibold text-gray-600">Kön</th>
                            <th className="py-2 px-3 font-semibold text-gray-600">Ålder</th>
                            <th className="py-2 px-3 font-semibold text-gray-600">Län</th>
                            <th className="py-2 px-3 font-semibold text-gray-600">Följare</th>
                            <th className="py-2 px-3 font-semibold text-gray-600 text-right">Kostnad</th>
                            <th className="py-2 px-3 font-semibold text-gray-600">Datum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDetails.slice(0, 25).map((reader, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-3">
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${reader.user_type === 'b2c' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                  {reader.user_type.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-gray-600 capitalize">{reader.gender || '—'}</td>
                              <td className="py-2 px-3 text-gray-600">{reader.age_group || '—'}</td>
                              <td className="py-2 px-3 text-gray-600 max-w-[120px] truncate">{reader.county || '—'}</td>
                              <td className="py-2 px-3">{reader.is_follower ? <span className="text-xs text-green-700 font-medium">✓ Ja</span> : <span className="text-xs text-gray-400">Nej</span>}</td>
                              <td className="py-2 px-3 text-right font-medium text-gray-700">{reader.cost} kr</td>
                              <td className="py-2 px-3 text-gray-500">{new Date(reader.read_at).toLocaleDateString('sv-SE')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredDetails.length > 25 && (
                        <p className="mt-2 text-xs text-gray-400">+ {filteredDetails.length - 25} fler läsare (totalt {filteredDetails.length})</p>
                      )}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
