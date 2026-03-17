'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, ExternalLink } from 'lucide-react'

interface Props {
  url: string
  zoom?: number
}

export default function PdfViewer({ url, zoom = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfRef = useRef<any>(null)
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null)

  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load the PDF document once on mount
  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      try {
        setLoading(true)
        setError(null)

        // Kontrollera att proxy-routen svarar korrekt innan PDF.js laddas
        const proxyUrl = `/api/pdf?url=${encodeURIComponent(url)}`
        const probeRes = await fetch(proxyUrl, { method: 'HEAD' })
        if (!probeRes.ok) {
          const text = await fetch(proxyUrl).then(r => r.text()).catch(() => '')
          throw new Error(`Proxy svarade med HTTP ${probeRes.status}${text ? ': ' + text : ''}`)
        }

        // Dynamically import pdfjs-dist to keep initial bundle small
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        // Proxya URL:en via /api/pdf för att undvika CORS-problem med Supabase storage.
        // PDF.js gör en fetch()-request från webbläsaren vilket kräver CORS-headers,
        // medan <img>/<video> inte har samma begränsning.
        const pdf = await pdfjsLib.getDocument({ url: proxyUrl, withCredentials: false }).promise
        if (cancelled) return

        pdfRef.current = pdf
        setNumPages(pdf.numPages)
        setCurrentPage(1)
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err)
          setError(msg)
        }
        console.error('PdfViewer load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPdf()
    return () => { cancelled = true }
  }, [url])

  // Render current page whenever page or zoom changes
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfRef.current || !canvasRef.current) return

    // Cancel any ongoing render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
      renderTaskRef.current = null
    }

    try {
      const page = await pdfRef.current.getPage(pageNum)
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Scale to fill the container width, then apply zoom
      const containerWidth = canvas.parentElement?.clientWidth ?? 600
      const viewport = page.getViewport({ scale: 1 })
      const scale = (containerWidth / viewport.width) * zoom
      const scaledViewport = page.getViewport({ scale })

      canvas.width  = scaledViewport.width
      canvas.height = scaledViewport.height

      const task = page.render({ canvasContext: ctx, viewport: scaledViewport })
      renderTaskRef.current = task
      await task.promise
      renderTaskRef.current = null
    } catch (err) {
      // RenderingCancelledException is expected when navigating quickly
      if ((err as { name?: string }).name !== 'RenderingCancelledException') {
        console.error('PdfViewer render error:', err)
      }
    }
  }, [zoom])

  useEffect(() => {
    if (!loading && pdfRef.current) {
      renderPage(currentPage)
    }
  }, [currentPage, loading, renderPage])

  function goTo(page: number) {
    setCurrentPage(Math.max(1, Math.min(numPages, page)))
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-100 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">Kunde inte ladda PDF:en</p>
        <p className="text-xs text-red-400 font-mono break-all max-w-sm">{error}</p>
        <a
          href={`/api/pdf?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <ExternalLink className="h-4 w-4" />
          Öppna PDF i nytt fönster
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
        <BookOpen className="h-8 w-8 animate-pulse" />
        <span className="text-sm">Laddar häftet…</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Canvas – PDF-sidan renderas här */}
      <div className="w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <canvas ref={canvasRef} className="block w-full" />
      </div>

      {/* Bläddringskontroller */}
      {numPages > 1 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Föregående sida"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-sm font-medium text-gray-700 min-w-[6rem] text-center">
            Sida {currentPage} av {numPages}
          </span>

          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Nästa sida"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
