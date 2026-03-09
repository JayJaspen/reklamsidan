'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, Download, Trash2, X, ZoomIn, ZoomOut, RotateCcw, Printer } from 'lucide-react'
import Image from 'next/image'

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

export default function B2CSparad() {
  const supabase = createClient()
  const [userId, setUserId]   = useState<string | null>(null)
  const [ads, setAds]         = useState<SavedAd[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [openAd, setOpenAd] = useState<SavedAd | null>(null)
  const [zoom, setZoom] = useState(1)

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

  function openViewer(ad: SavedAd) {
    setOpenAd(ad)
    setZoom(1)
  }

  function printAd(ad: SavedAd) {
    const win = window.open(ad.file_url, '_blank')
    win?.addEventListener('load', () => win.print())
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
              className={`card flex items-center gap-4 p-4 transition cursor-pointer hover:shadow-md ${selected.has(ad.id) ? 'ring-2 ring-primary-500 bg-primary-50/30' : ''}`}
              onClick={() => openViewer(ad)}
            >
              <input type="checkbox" checked={selected.has(ad.id)}
                onChange={e => { e.stopPropagation(); toggleSelect(ad.id) }}
                onClick={e => e.stopPropagation()}
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

              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
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
      {/* Reklamvisare-modal */}
      {openAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                {openAd.logo_url ? (
                  <img src={openAd.logo_url} alt={openAd.company_name} className="h-8 w-8 rounded object-contain" />
                ) : null}
                <div>
                  <p className="font-semibold text-gray-900">{openAd.company_name}</p>
                  <p className="text-xs text-gray-400">{openAd.name}</p>
                </div>
              </div>
              <button onClick={() => setOpenAd(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Zoom controls */}
            {openAd.file_type !== 'mp4' && (
              <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-2 bg-gray-50">
                <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                  disabled={zoom <= 0.5} className="rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-40">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] text-center text-xs font-medium text-gray-600">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}
                  disabled={zoom >= 3} className="rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-40">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button onClick={() => setZoom(1)} className="rounded p-1.5 text-gray-400 hover:bg-gray-200">
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {openAd.file_type === 'mp4' ? (
                <video controls className="w-full rounded-lg">
                  <source src={openAd.file_url} type="video/mp4" />
                </video>
              ) : openAd.file_type === 'pdf' ? (
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.15s' }}>
                  <iframe src={openAd.file_url} className="h-[600px] w-full rounded-lg border" title={openAd.name} />
                </div>
              ) : (
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.15s' }}>
                  <Image src={openAd.file_url} alt={openAd.name} width={800} height={600} className="w-full rounded-lg object-contain" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => printAd(openAd)} className="btn-secondary gap-2 text-sm">
                <Printer className="h-4 w-4" /> Skriv ut
              </button>
              <button onClick={() => downloadAd(openAd)} className="btn-secondary gap-2 text-sm">
                <Download className="h-4 w-4" /> Ladda ner
              </button>
              <button onClick={() => setOpenAd(null)} className="ml-auto rounded-lg px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-100">
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
