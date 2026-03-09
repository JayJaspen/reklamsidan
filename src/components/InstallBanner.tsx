'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share, Plus, Chrome } from 'lucide-react'

// ── Enhetsdetektering ──────────────────────────────────────────
type Platform =
  | 'ios-safari'       // iPhone/iPad i Safari  → kan installeras
  | 'ios-other'        // iPhone/iPad i annan webbläsare → be dem öppna Safari
  | 'android-chrome'   // Android i Chrome → native prompt
  | 'android-other'    // Android i annan webbläsare → be dem öppna Chrome
  | 'unsupported'      // Desktop eller okänd

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unsupported'
  const ua = navigator.userAgent

  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(ua)
  const isChrome = /Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)
  const isChromeIOS = /CriOS/i.test(ua)

  if (isIOS) {
    return isSafari ? 'ios-safari' : 'ios-other'
  }
  if (isAndroid) {
    return isChrome ? 'android-chrome' : 'android-other'
  }
  return 'unsupported'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  )
}

// ── Bannerinnehåll per plattform ───────────────────────────────
function BannerContent({ platform }: { platform: Platform }) {
  switch (platform) {
    case 'ios-safari':
      return (
        <>
          <p className="font-semibold text-gray-900 text-sm">Installera Reklamsidan</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Tryck på{' '}
            <span className="inline-flex items-center gap-0.5 font-medium text-blue-600">
              <Share className="h-3.5 w-3.5" /> Dela
            </span>
            {' '}och välj{' '}
            <span className="font-medium text-blue-600">
              "Lägg till på hemskärmen"
            </span>
          </p>
        </>
      )

    case 'ios-other':
      return (
        <>
          <p className="font-semibold text-gray-900 text-sm">Öppna i Safari för att installera</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Kopiera länken och öppna den i{' '}
            <span className="font-medium text-blue-600">Safari</span>
            {' '}— sedan kan du installera appen på hemskärmen.
          </p>
        </>
      )

    case 'android-chrome':
      return (
        <>
          <p className="font-semibold text-gray-900 text-sm">Installera Reklamsidan</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Tryck på menyn{' '}
            <span className="font-medium text-gray-800">⋮</span>
            {' '}i Chrome och välj{' '}
            <span className="font-medium text-blue-600">"Installera app"</span>
            {' '}eller{' '}
            <span className="font-medium text-blue-600">"Lägg till på startskärmen"</span>
          </p>
        </>
      )

    case 'android-other':
      return (
        <>
          <p className="font-semibold text-gray-900 text-sm">Öppna i Chrome för att installera</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Öppna sidan i{' '}
            <span className="inline-flex items-center gap-0.5 font-medium text-blue-600">
              <Chrome className="h-3.5 w-3.5" /> Google Chrome
            </span>
            {' '}för att kunna installera appen på din telefon.
          </p>
        </>
      )

    default:
      return null
  }
}

// ── Huvudkomponent ─────────────────────────────────────────────
export default function InstallBanner() {
  const [platform, setPlatform] = useState<Platform>('unsupported')
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Registrera service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }

    // Visa inte om redan installerad
    if (isStandalone()) return

    // Visa inte om användaren stängt bannern nyligen (24h)
    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return

    const p = detectPlatform()
    if (p === 'unsupported') return

    // Fånga Chrome/Android native install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    })

    setPlatform(p)

    // Fördröj visning 2s så sidan hinner ladda klart
    const timer = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString())
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setVisible(false)
      setDeferredPrompt(null)
    }
  }

  if (!visible || platform === 'unsupported') return null

  return (
    <div
      className={`
        fixed left-4 right-4 z-[9999]
        transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
      role="banner"
      aria-label="Installera app"
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.15)] px-4 py-3 flex items-start gap-3">
        {/* Ikon */}
        <img
          src="/icons/icon-72x72.png"
          alt="Reklamsidan"
          className="h-10 w-10 rounded-xl flex-shrink-0 mt-0.5"
        />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <BannerContent platform={platform} />
        </div>

        {/* Installera-knapp (Android Chrome med native prompt) */}
        {platform === 'android-chrome' && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Installera
          </button>
        )}

        {/* Stäng */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Stäng"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
