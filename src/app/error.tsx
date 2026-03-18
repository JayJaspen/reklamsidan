'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl mb-4">⚠️</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Något gick fel</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Ett oväntat fel uppstod. Försök igen eller kontakta oss om problemet kvarstår.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition"
        >
          Försök igen
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          Till startsidan
        </Link>
      </div>
    </div>
  )
}
