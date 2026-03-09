'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, Download, Trash2 } from 'lucide-react'

type SavedAd = {
  id: string
  ad_id: string
  name: string
  file_url: string
  file_type: string
  company_name: string
  logo_url: string | null
  valid_to: string
}

export default function B2BSparad() {
  const supabase = createClient()
  const [userId, setUserId]   = useState<string | null>(null)
  const [ads, setAds]         = useState<SavedAd[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        setUserId(user.id)
        const { data, error } = await supabase
          .from('saved_ads')
          .select(`
            id, ad_id,
            ads(name, file_url, file_type, valid_to,
              companies(public_name, logo_url))
          `)
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false })
        if (error) console.error('Sparad reklam fel:', error)
        if (data) {
          setAds(data.map((s: unknown) => {
            const row = s as {
              id: string; ad_id: string;
              ads: { name: string; file_url: string; file_type: string; valid_to: string;
                companies: { public_name: string; logo_url: string | null } }
            }
            return {
              id: row.id,
              ad_id: row.ad_id,
              name: row.ads.name,
              file_url: row.ads.file_url,
              file_type: row.ads.file_type,
              valid_to: row.ads.valid_to,
              company_name: row.ads.companies.public_name,
              logo_url: row.ads.companies.logo_url,
            }
          }))
        }
      } catch (e) {
        console.error('Sparad reklam oväntat fel:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function toggleSelect(id: string) {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  async function deleteSelected() {
    if (!userId) return
    const ids = [...selected]
    await supabase.from('saved_ads').delete().in('id', ids)
    setAds(a => a.filter(x => !selected.has(x.id)))
    setSelected(new Set())
  }

  async function deleteAll() {
    if (!userId) return
    await supabase.from('saved_ads').delete().eq('user_id', userId)
    setAds([])
    setSelected(new Set())
  }

  function downloadAd(ad: SavedAd) {
    const a = document.createElement('a')
    a.href = ad.file_url
    a.download = `${ad.name}.${ad.file_type}`
    a.target = '_blank'
    a.click()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary-600" /> Sparad reklam
          </h1>
          <p className="text-sm text-gray-500">{ads.length} sparade annonser</p>
        </div>
        {ads.length > 0 && (
          <div className="flex gap-2">
            {selected.size > 0 && (
              <button onClick={deleteSelected} className="btn-secondary gap-2 text-red-600">
                <Trash2 className="h-4 w-4" /> Ta bort markerade ({selected.size})
              </button>
            )}
            <button onClick={deleteAll} className="btn-secondary gap-2 text-red-600">
              <Trash2 className="h-4 w-4" /> Rensa alla
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="py-12 text-center text-gray-400">Laddar...</p>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <Bookmark className="mb-4 h-14 w-14 text-gray-200" />
          <h2 className="mb-2 text-lg font-semibold text-gray-400">Ingen sparad reklam</h2>
          <p className="text-sm text-gray-400">
            Öppna en annons och tryck på <strong>Spara</strong> för att spara den här.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => (
            <div key={ad.id}
              className={`card flex items-center gap-4 p-4 transition ${selected.has(ad.id) ? 'ring-2 ring-primary-500 bg-primary-50/30' : ''}`}
            >
              <input type="checkbox" checked={selected.has(ad.id)}
                onChange={() => toggleSelect(ad.id)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600" />

              {ad.logo_url ? (
                <img src={ad.logo_url} alt={ad.company_name} className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold">
                  {ad.company_name.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{ad.company_name}</p>
                <p className="text-sm text-gray-600 truncate">{ad.name}</p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => downloadAd(ad)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <Download className="h-4 w-4" />
                </button>
                <button onClick={() => {
                  setSelected(new Set([ad.id]))
                  setTimeout(deleteSelected, 50)
                }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
