'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share, Chrome } from 'lucide-react'

// ── Enhetsdetektering ──────────────────────────────────────────
type Platform =
  | 'ios-safari'
  | 'ios-other'
  | 'android-chrome'
  | 'android-other'
  | 'unsupported'

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unsupported'
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(ua)
  const isChrome = /Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)
  if (isIOS) return isSafari ? 'ios-safari' : 'ios-other'
  if (isAndroid) return isChrome ? 'android-chrome' : 'android-other'
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
          <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: 0 }}>Installera Reklamsidan</p>
          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 2, marginBottom: 0 }}>
            Tryck på{' '}
            <span style={{ color: '#2563eb', fontWeight: 500 }}>
              Dela-knappen
            </span>
            {' '}och välj{' '}
            <span style={{ color: '#2563eb', fontWeight: 500 }}>
              "Lägg till på hemskärmen"
            </span>
          </p>
        </>
      )
    case 'ios-other':
      return (
        <>
          <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: 0 }}>Öppna i Safari för att installera</p>
          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 2, marginBottom: 0 }}>
            Öppna sidan i{' '}
            <span style={{ color: '#2563eb', fontWeight: 500 }}>Safari</span>
            {' '}för att kunna installera appen.
          </p>
        </>
      )
    case 'android-chrome':
      return (
        <>
          <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: 0 }}>Installera Reklamsidan</p>
          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 2, marginBottom: 0 }}>
            Tryck på{' '}
            <span style={{ color: '#111827', fontWeight: 500 }}>⋮</span>
            {' '}i Chrome och välj{' '}
            <span style={{ color: '#2563eb', fontWeight: 500 }}>"Installera app"</span>
          </p>
        </>
      )
    case 'android-other':
      return (
        <>
          <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: 0 }}>Öppna i Chrome för att installera</p>
          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 2, marginBottom: 0 }}>
            Öppna sidan i{' '}
            <span style={{ color: '#2563eb', fontWeight: 500 }}>Google Chrome</span>
            {' '}för att kunna installera appen.
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
  const [mounted, setMounted] = useState(false)   // styr om elementet finns i DOM
  const [slid, setSlid] = useState(false)          // styr slide-up-animationen
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Registrera service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }

    if (isStandalone()) return

    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return

    const p = detectPlatform()
    if (p === 'unsupported') return

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    })

    setPlatform(p)

    // 1) Montera elementet (utanför skärmen, inga reflows) efter 1.5s
    const mountTimer = setTimeout(() => {
      setMounted(true)
      // 2) Trigga slide-up lite efter att elementet renderas i DOM
      setTimeout(() => setSlid(true), 60)
    }, 1500)

    return () => clearTimeout(mountTimer)
  }, [])

  function dismiss() {
    setSlid(false)
    setTimeout(() => setMounted(false), 400)
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString())
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') dismiss()
      setDeferredPrompt(null)
    }
  }

  if (!mounted || platform === 'unsupported') return null

  return (
    <div
      role="banner"
      aria-label="Installera app"
      style={{
        // ── Positionering ──────────────────────────────────────
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        // ── Slide-up animation ─────────────────────────────────
        transform: slid ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        // ── Utseende ──────────────────────────────────────────
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
        // ── Innehåll ──────────────────────────────────────────
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        // Safe-area för iPhone Home Indicator
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      }}
    >
      {/* App-ikon */}
      <img
        src="/icons/icon-72x72.png"
        alt="Reklamsidan"
        style={{ height: 44, width: 44, borderRadius: 10, flexShrink: 0, marginTop: 1 }}
      />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <BannerContent platform={platform} />
      </div>

      {/* Installera-knapp (Android Chrome med native prompt) */}
      {platform === 'android-chrome' && deferredPrompt && (
        <button
          onClick={handleInstallClick}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 8,
            backgroundColor: '#2563eb',
            padding: '7px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Download style={{ height: 14, width: 14 }} />
          Installera
        </button>
      )}

      {/* Stäng-knapp */}
      <button
        onClick={dismiss}
        aria-label="Stäng"
        style={{
          flexShrink: 0,
          borderRadius: '50%',
          padding: 6,
          color: '#9ca3af',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X style={{ height: 16, width: 16 }} />
      </button>
    </div>
  )
}
