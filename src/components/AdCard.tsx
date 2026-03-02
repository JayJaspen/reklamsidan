'use client'

import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, Trash2, X, Download } from 'lucide-react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

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

  async function markRead() {
    await supabase.from('ad_reads').upsert({
      ad_id: ad.id, user_id: userId, tab_source: tabSource
    }, { onConflict: 'ad_id,user_id', ignoreDuplicates: true })
  }

  async function handleOpen() {
    setOpen(true)
    await markRead()
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
        className="card flex items-start gap-4 p-4 text-left transition hover:shadow-md w-full"
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

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                {ad.company_logo && (
                  <Image src={ad.company_logo} alt={ad.company_name} width={32} height={32} className="rounded" />
                )}
                <div>
                  <p className="font-semibold text-gray-900">{ad.company_name}</p>
                  <p className="text-xs text-gray-400">{ad.name}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {ad.file_type === 'mp4' ? (
                <video controls className="w-full rounded-lg">
                  <source src={ad.file_url} type="video/mp4" />
                </video>
              ) : ad.file_type === 'pdf' ? (
                <iframe src={ad.file_url} className="h-96 w-full rounded-lg border" title={ad.name} />
              ) : (
                <Image src={ad.file_url} alt={ad.name} width={800} height={600}
                  className="w-full rounded-lg object-contain" />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={handleSave} disabled={saved}
                className="btn-primary flex-1 gap-2 text-sm">
                <Bookmark className="h-4 w-4" />
                {saved ? 'Sparad' : 'Spara'}
              </button>
              <button onClick={handleDownload} className="btn-secondary gap-2 text-sm">
                <Download className="h-4 w-4" /> Ladda ner
              </button>
              <button onClick={handleDiscard} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Släng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
