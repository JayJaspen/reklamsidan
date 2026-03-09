'use client'

import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, Trash2, X, Download, Printer, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import PdfViewer from './PdfViewer'

interface Ad {
  id: string
  name: string
  file_url: string
  file_type: string
  valid_from: string
  valid_to: string
  company_name: string
  company_logo: string | null
}

interface Props {
  ad: Ad
  userId: string
  tabSource: 1 | 2 | 3
  onDiscard?: (adId: string) => void
}

export default function AdCard({ ad, userId, tabSource, onDiscard }: Props) {
  const supabase = createClient()
  const [open, setOpen]   = useState(false)
  const [saved, setSaved] = useState(false)
  const [zoom, setZoom]   = useState(1)

  async function markRead() {
    await supabase.from('ad_reads').upsert({
      ad_id: ad.id, user_id: userId, tab_source: tabSource
    }, { onConflict: 'ad_id,user_id', ignoreDuplicates: true })
  }

  async function handleOpen() {
    setOpen(true)
    setZoom(1)
    await markRead()
  }

  function handlePrint() {
    const win = window.open(ad.file_url, '_blank')
    win?.addEventListener('load', () => win.print())
  }

  async function handleSave() {
    await supabase.from('saved_ads').upsert({ user_id: userId, ad_id: ad.id }, { ignoreDuplicates: true })
    setSaved(true)
    setOpen(false)
  }

  async function handleDiscard() {
    await supabase.from('discarded_ads').insert({ user_id: userId, ad_id: ad.id })
    setOpen(false)
    onDiscard?.(ad.id)
  }

  function handleDownload() {
    const a = document.createElement('a')
    a.href = ad.file_url
    a.download = `${ad.name}.${ad.file_type}`
    a.target = '_blank'
    a.click()
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="card-hover flex items-start gap-4 p-4 text-left w-full"
      >
        {ad.company_logo ? (
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            <Image src={ad.company_logo} alt={ad.company_name} width={48} height={48} className="object-contain" />
          </div>
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 font-bold text-lg">
            {ad.company_name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{ad.company_name}</p>
          <p className="text-sm text-gray-600 truncate">{ad.name}</p>
          <p className="mt-1 text-xs text-gray-400">
            {format(new Date(ad.valid_from), 'd MMM', { locale: sv })} –{' '}
            {format(new Date(ad.valid_to), 'd MMM yyyy', { locale: sv })}
          </p>
        </div>
        {saved && <Bookmark className="h-4 w-4 text-primary-600 flex-shrink-0" />}
      </button>

      {/* Modal – fullskärm på mobil, centrerad dialog på desktop */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4">
          <div className="flex w-full sm:max-w-2xl flex-col bg-white shadow-2xl
                          h-[95dvh] sm:h-auto sm:max-h-[90vh]
                          rounded-t-2xl sm:rounded-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                {ad.company_logo && (
                  <Image src={ad.company_logo} alt={ad.company_name} width={32} height={32} className="rounded" />
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{ad.company_name}</p>
                  <p className="text-xs text-gray-400">{ad.name}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Zoom controls – döljs på mobil (pinch-to-zoom fungerar naturligt) */}
            {ad.file_type !== 'mp4' && (
              <div className="hidden sm:flex items-center gap-2 border-b border-gray-100 px-6 py-2 bg-gray-50 flex-shrink-0">
                <button
                  onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-40"
                  disabled={zoom <= 0.5}
                  title="Zooma ut"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] text-center text-xs font-medium text-gray-600">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-40"
                  disabled={zoom >= 3}
                  title="Zooma in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-200"
                  title="Återställ zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Content – scroll inom modalen */}
            <div className="flex-1 overflow-auto p-3 sm:p-6">
              {ad.file_type === 'mp4' ? (
                <video controls className="w-full rounded-lg" playsInline>
                  <source src={ad.file_url} type="video/mp4" />
                </video>
              ) : ad.file_type === 'pdf' ? (
                <PdfViewer url={ad.file_url} zoom={zoom} />
              ) : (
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.15s' }}>
                  <Image src={ad.file_url} alt={ad.name} width={800} height={600}
                    className="w-full rounded-lg object-contain" />
                </div>
              )}
            </div>

            {/* Actions – radbryts på mobil */}
            <div className="flex flex-wrap gap-2 border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
              style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
              <button onClick={handleSave} disabled={saved}
                className="btn-primary flex-1 gap-1.5 text-sm min-w-[80px]">
                <Bookmark className="h-4 w-4" />
                {saved ? 'Sparad' : 'Spara'}
              </button>
              <button onClick={handleDownload} className="btn-secondary gap-1.5 text-sm">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Ladda ner</span>
              </button>
              <button onClick={handlePrint} className="btn-secondary gap-1.5 text-sm hidden sm:flex">
                <Printer className="h-4 w-4" /> Skriv ut
              </button>
              <button onClick={handleDiscard} className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Släng</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
