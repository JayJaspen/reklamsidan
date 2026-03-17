'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Send, Users } from 'lucide-react'
import { SWEDISH_COUNTIES } from '@/lib/utils'

const AGE_GROUPS = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+']
const GENDERS = [
  { value: 'man', label: 'Man' },
  { value: 'kvinna', label: 'Kvinna' },
  { value: 'annat', label: 'Annat' },
]

type TargetingSettings = {
  type: 'b2c' | 'b2b'
  genders: string[]
  ageGroups: string[]
  counties: string[]
  categories: number[]
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export default function SkickaReklam() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [adName, setAdName] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')

  const today = toDateString(new Date())
  const maxFromDate = toDateString(addMonths(new Date(), 2))
  const maxToDate = validFrom
    ? toDateString(addMonths(new Date(validFrom + 'T00:00:00'), 2))
    : maxFromDate
  const [targeting, setTargeting] = useState<TargetingSettings>({
    type: 'b2c',
    genders: [],
    ageGroups: [],
    counties: [],
    categories: [],
  })
  const [categories, setCategories] = useState<{ id: number; name: string; parent_id: number | null }[]>([])
  const [costLimit, setCostLimit] = useState('')
  const [audienceCount, setAudienceCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedAdName, setSubmittedAdName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      // Fetch categories
      const { data: catData } = await supabase
        .from(targeting.type === 'b2c' ? 'categories_b2c' : 'categories_b2b')
        .select('id,name,parent_id')
        .eq('is_active', true)
        .order('sort_order')

      if (catData) setCategories(catData)
    })
  }, [])

  useEffect(() => {
    // Fetch categories when type changes
    supabase
      .from(targeting.type === 'b2c' ? 'categories_b2c' : 'categories_b2b')
      .select('id,name,parent_id')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setCategories(data)
      })
  }, [targeting.type])

  useEffect(() => {
    if (userId) calculateAudienceCount()
  }, [targeting, userId])

  async function calculateAudienceCount() {
    if (!userId) return

    // Steg 1: Hämta följare av detta företag
    const { data: followers } = await supabase
      .from('user_favorites')
      .select('user_id')
      .eq('company_id', userId)

    const candidateIds = new Set((followers ?? []).map(f => f.user_id as string))

    // Steg 2: Lägg till användare som följer valda kategorier
    if (targeting.categories.length > 0) {
      const userCatTable = targeting.type === 'b2c' ? 'users_b2c_categories' : 'users_b2b_categories'
      const { data: catUsers } = await supabase
        .from(userCatTable)
        .select('user_id')
        .in('category_id', targeting.categories)
      ;(catUsers ?? []).forEach(u => candidateIds.add(u.user_id as string))
    }

    if (candidateIds.size === 0) {
      setAudienceCount(0)
      return
    }

    const ids = [...candidateIds]

    if (targeting.type === 'b2c') {
      // Steg 3 B2C: filtrera på kön, ålder (via birth_year), län bland kandidaterna
      let query = supabase
        .from('users_b2c')
        .select('id', { count: 'exact', head: true })
        .in('id', ids)

      if (targeting.genders.length > 0) {
        query = query.in('gender', targeting.genders)
      }

      // Åldersgrupper filtreras via birth_year (users_b2c saknar age_group-kolumn)
      if (targeting.ageGroups.length > 0 && targeting.ageGroups.length < 6) {
        const currentYear = new Date().getFullYear()
        const ageGroupMap: Record<string, [number, number]> = {
          '18-25': [currentYear - 25, currentYear - 18],
          '26-35': [currentYear - 35, currentYear - 26],
          '36-45': [currentYear - 45, currentYear - 36],
          '46-55': [currentYear - 55, currentYear - 46],
          '56-65': [currentYear - 65, currentYear - 56],
          '65+':   [1900,             currentYear - 65],
        }
        const orParts = targeting.ageGroups
          .filter(g => ageGroupMap[g])
          .map(g => {
            const [min, max] = ageGroupMap[g]
            return `birth_year.gte.${min},birth_year.lte.${max}`
          })
        if (orParts.length > 0) {
          query = (query as any).or(orParts.join(','))
        }
      }

      if (targeting.counties.length > 0) {
        query = query.in('county_id', targeting.counties.map(c =>
          (SWEDISH_COUNTIES as readonly string[]).indexOf(c) + 1
        ))
      }

      const { count } = await query
      setAudienceCount(count ?? 0)
    } else {
      // Steg 3 B2B: filtrera på län bland kandidaterna
      let query = supabase
        .from('users_b2b')
        .select('id', { count: 'exact', head: true })
        .in('id', ids)

      if (targeting.counties.length > 0) {
        query = query.in('county_id', targeting.counties.map(c =>
          (SWEDISH_COUNTIES as readonly string[]).indexOf(c) + 1
        ))
      }

      const { count } = await query
      setAudienceCount(count ?? 0)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !file || !adName || !validFrom || !validTo) {
      alert('Fyll i alla obligatoriska fält')
      return
    }

    // Datumvalidering – max 2 månader från idag
    const todayDate = new Date(); todayDate.setHours(0,0,0,0)
    const fromDate = new Date(validFrom + 'T00:00:00')
    const toDate   = new Date(validTo   + 'T00:00:00')
    const maxFrom  = addMonths(todayDate, 2)
    const maxTo    = addMonths(fromDate,  2)
    if (fromDate < todayDate) {
      alert('Startdatum kan inte vara i det förflutna.')
      return
    }
    if (fromDate > maxFrom) {
      alert('Startdatum får vara max 2 månader framåt.')
      return
    }
    if (toDate < fromDate) {
      alert('Slutdatum måste vara samma dag eller efter startdatum.')
      return
    }
    if (toDate > maxTo) {
      alert('Slutdatum får vara max 2 månader efter startdatum.')
      return
    }

    // Filvalidering – kontrollera storlek och MIME-typ
    const MAX_SIZE_MB = 20
    const ALLOWED_MIME_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'video/mp4',
    ]
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`Filen är för stor. Max ${MAX_SIZE_MB} MB tillåtet.`)
      return
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      alert('Otillåten filtyp. Tillåtna format: PDF, JPG, PNG, MP4.')
      return
    }

    setUploading(true)

    try {
      // Upload file to storage
      const ext = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('ads')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw new Error(`Uppladdning misslyckades: ${uploadError.message}`)

      const fileUrl = supabase.storage.from('ads').getPublicUrl(fileName).data.publicUrl

      // Create ad record
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          company_id: userId,
          name: adName,
          file_url: fileUrl,
          file_type: ext,
          ad_type: targeting.type,
          valid_from: validFrom,
          valid_to: validTo,
          cost_limit: costLimit ? parseInt(costLimit) : null,
        })
        .select()
        .single()

      if (adError) throw new Error(`Databasfel: ${adError.message}`)

      // Add targeting data
      if (targeting.type === 'b2c') {
        if (targeting.genders.length > 0) {
          await supabase.from('ad_target_genders_b2c').insert(
            targeting.genders.map(g => ({ ad_id: adData.id, gender: g }))
          )
        }

        if (targeting.ageGroups.length > 0) {
          await supabase.from('ad_target_ages_b2c').insert(
            targeting.ageGroups.map(a => ({ ad_id: adData.id, age_group: a }))
          )
        }

        if (targeting.counties.length > 0) {
          await supabase.from('ad_target_counties_b2c').insert(
            targeting.counties.map(c => ({
              ad_id: adData.id,
              county_id: (SWEDISH_COUNTIES as readonly string[]).indexOf(c) + 1,
            }))
          )
        }

        if (targeting.categories.length > 0) {
          await supabase.from('ad_target_categories_b2c').insert(
            targeting.categories.map(cat => ({ ad_id: adData.id, category_id: cat }))
          )
        }
      } else {
        if (targeting.categories.length > 0) {
          await supabase.from('ad_target_categories_b2b').insert(
            targeting.categories.map(cat => ({ ad_id: adData.id, category_id: cat }))
          )
        }

        if (targeting.counties.length > 0) {
          await supabase.from('ad_target_counties_b2b').insert(
            targeting.counties.map(c => ({
              ad_id: adData.id,
              county_id: (SWEDISH_COUNTIES as readonly string[]).indexOf(c) + 1,
            }))
          )
        }
      }

      // Skicka push-notiser till följare och intresserade (fire-and-forget)
      fetch('/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: adData.id }),
      }).catch(err => console.warn('Push notify misslyckades:', err))

      setSubmittedAdName(adName)
      setSubmitted(true)
      setFile(null)
      setAdName('')
      setValidFrom('')
      setValidTo('')
      setCostLimit('')
      setTargeting({ type: 'b2c', genders: [], ageGroups: [], counties: [], categories: [] })
    } catch (error) {
      console.error('Error:', error)
      alert(`Fel vid skapande av annons: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    } finally {
      setUploading(false)
    }
  }

  function toggleCounty(county: string) {
    setTargeting(t => ({
      ...t,
      counties: t.counties.includes(county)
        ? t.counties.filter(c => c !== county)
        : [...t.counties, county],
    }))
  }

  function handleAllaTargets(checked: boolean) {
    setTargeting(t => ({
      ...t,
      genders: checked ? GENDERS.map(g => g.value) : [],
      ageGroups: checked ? [...AGE_GROUPS] : [],
      counties: checked ? [...SWEDISH_COUNTIES] : [],
    }))
  }

  const allTargetsSelected =
    targeting.genders.length === GENDERS.length &&
    targeting.ageGroups.length === AGE_GROUPS.length &&
    targeting.counties.length === SWEDISH_COUNTIES.length

  const mainCats = categories.filter(c => c.parent_id === null)
  const subCats = (pid: number) => categories.filter(c => c.parent_id === pid)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Send className="h-6 w-6 text-green-600" /> Skicka reklam
        </h1>
        <p className="text-sm text-gray-500">Skapa och publicera en ny reklamkampanj</p>
      </div>

      {submitted && (
        <div className="card p-10 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Annons publicerad!</h2>
            <p className="mt-2 text-gray-500">
              <span className="font-medium text-gray-700">&ldquo;{submittedAdName}&rdquo;</span> är nu live och visas för din målgrupp.
            </p>
          </div>
          <p className="text-sm text-gray-400">Du kan följa läsningar och kostnad under Statistik.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="btn-primary mx-auto gap-2 px-8"
          >
            <Send className="h-4 w-4" /> Skicka ny annons
          </button>
        </div>
      )}

      {!submitted && <form onSubmit={handleSubmit} className="space-y-6">
        {/* File upload */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Mediainnehål</h2>
          <label className="block">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                {file ? file.name : 'Klicka eller dra för att ladda upp'}
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, eller MP4</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.mp4"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* Ad details */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Annonsdetaljer</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Annonsnamn</label>
            <input
              type="text"
              className="input-field"
              value={adName}
              onChange={e => setAdName(e.target.value)}
              placeholder="t.ex. Sommarkampanj 2026"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Gäller från</label>
              <input
                type="date"
                className="input-field"
                value={validFrom}
                min={today}
                max={maxFromDate}
                onChange={e => {
                  setValidFrom(e.target.value)
                  // Om validTo ligger efter nytt maxdatum, rensa det
                  if (validTo) {
                    const newMax = toDateString(addMonths(new Date(e.target.value + 'T00:00:00'), 2))
                    if (validTo > newMax) setValidTo('')
                  }
                }}
                required
              />
              <p className="mt-1 text-xs text-gray-400">Tidigast idag, senast 2 månader framåt</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Gäller till</label>
              <input
                type="date"
                className="input-field"
                value={validTo}
                min={validFrom || today}
                max={maxToDate}
                onChange={e => setValidTo(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-400">Max 2 månader efter startdatum</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">
              Kostnadsgräns (SEK) <span className="text-gray-400 font-normal">– valfritt</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                className="input-field pr-12"
                placeholder="t.ex. 500"
                value={costLimit}
                onChange={e => setCostLimit(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">kr</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Annonsen döljs automatiskt när kostnadsgränsen nås.</p>
          </div>
        </div>

        {/* Targeting type */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Målgrupp</h2>
          <div className="flex gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="b2c"
                checked={targeting.type === 'b2c'}
                onChange={() => setTargeting(t => ({ ...t, type: 'b2c' }))}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">B2C (Konsumenter)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="b2b"
                checked={targeting.type === 'b2b'}
                onChange={() => setTargeting(t => ({ ...t, type: 'b2b' }))}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">B2B (Företag)</span>
            </label>
          </div>

          {/* B2C targeting */}
          {targeting.type === 'b2c' && (
            <div className="space-y-4">
              {/* Alla målgrupper */}
              <label className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-primary-200 bg-primary-50 p-3">
                <input
                  type="checkbox"
                  checked={allTargetsSelected}
                  onChange={e => handleAllaTargets(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm font-semibold text-primary-700">Alla målgrupper</span>
                <span className="text-xs text-primary-500">(markerar alla kön, åldrar &amp; län)</span>
              </label>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">Kön</label>
                <div className="space-y-2">
                  {GENDERS.map(g => (
                    <label key={g.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targeting.genders.includes(g.value)}
                        onChange={e => setTargeting(t => ({
                          ...t,
                          genders: e.target.checked
                            ? [...t.genders, g.value]
                            : t.genders.filter(x => x !== g.value),
                        }))}
                        className="h-4 w-4 rounded"
                      />
                      <span className="text-sm text-gray-700">{g.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">Åldersgrupper</label>
                <div className="grid grid-cols-3 gap-2">
                  {AGE_GROUPS.map(age => (
                    <label key={age} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targeting.ageGroups.includes(age)}
                        onChange={e => setTargeting(t => ({
                          ...t,
                          ageGroups: e.target.checked
                            ? [...t.ageGroups, age]
                            : t.ageGroups.filter(x => x !== age),
                        }))}
                        className="h-4 w-4 rounded"
                      />
                      <span className="text-sm text-gray-700">{age}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">Län</label>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 p-3 max-h-48 overflow-y-auto">
                  {SWEDISH_COUNTIES.map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={targeting.counties.includes(c)}
                        onChange={() => toggleCounty(c)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                      <span className="text-sm text-gray-700">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">Kategorier</label>
                <div className="max-h-40 overflow-y-auto space-y-3">
                  {mainCats.map(main => (
                    <div key={main.id}>
                      <p className="text-xs font-bold uppercase text-gray-400 mb-1">{main.name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {subCats(main.id).map(sub => (
                          <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={targeting.categories.includes(sub.id)}
                              onChange={e => setTargeting(t => ({
                                ...t,
                                categories: e.target.checked
                                  ? [...t.categories, sub.id]
                                  : t.categories.filter(x => x !== sub.id),
                              }))}
                              className="h-4 w-4 rounded"
                            />
                            <span className="text-sm text-gray-700">{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* B2B targeting */}
          {targeting.type === 'b2b' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">Kategorier</label>
                <div className="max-h-40 overflow-y-auto space-y-3">
                  {mainCats.map(main => (
                    <div key={main.id}>
                      <p className="text-xs font-bold uppercase text-gray-400 mb-1">{main.name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {subCats(main.id).map(sub => (
                          <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={targeting.categories.includes(sub.id)}
                              onChange={e => setTargeting(t => ({
                                ...t,
                                categories: e.target.checked
                                  ? [...t.categories, sub.id]
                                  : t.categories.filter(x => x !== sub.id),
                              }))}
                              className="h-4 w-4 rounded"
                            />
                            <span className="text-sm text-gray-700">{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">Län</label>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 p-3 max-h-48 overflow-y-auto">
                  {SWEDISH_COUNTIES.map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={targeting.counties.includes(c)}
                        onChange={() => toggleCounty(c)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                      <span className="text-sm text-gray-700">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Audience counter */}
        <div className="card p-4 bg-blue-50 border border-blue-200 flex items-start gap-3">
          <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Målgrupp</p>
            <p className="text-2xl font-bold text-blue-600">{audienceCount.toLocaleString('sv-SE')}</p>
            <p className="text-xs text-blue-700">följare av ditt företag och/eller intresserade av valda kategorier</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || !file || !adName || !validFrom || !validTo}
          className="btn-primary w-full py-3 gap-2"
        >
          <Send className="h-4 w-4" />
          {uploading ? 'Publicerar...' : 'Publicera annons'}
        </button>
      </form>}
    </div>
  )
}
