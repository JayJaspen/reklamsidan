'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'

// VAPID public key (base64url-format)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buf = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return view
}

type State = 'loading' | 'unsupported' | 'default' | 'pending' | 'granted' | 'denied'

export default function NotificationPermission() {
  const [state, setState] = useState<State>('loading')

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    const perm = Notification.permission
    if (perm === 'granted') {
      setState('granted')
    } else if (perm === 'denied') {
      setState('denied')
    } else {
      setState('default')
    }
  }, [])

  async function handleEnable() {
    setState('pending')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        return
      }

      // Registrera service worker och prenumerera
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const sub = subscription.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh:   sub.keys?.p256dh,
          auth:     sub.keys?.auth,
        }),
      })

      setState('granted')
    } catch (err) {
      console.error('Push subscribe error:', err)
      setState('default')
    }
  }

  async function handleDisable() {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }
      setState('default')
    } catch (err) {
      console.error('Push unsubscribe error:', err)
    }
  }

  // Dölj på desktop och om ej stöds
  if (state === 'loading' || state === 'unsupported') return null

  if (state === 'granted') {
    return (
      <button
        onClick={handleDisable}
        title="Stäng av notiser"
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
      >
        <BellRing className="h-4 w-4" />
        <span className="hidden sm:inline">Notiser på</span>
      </button>
    )
  }

  if (state === 'denied') {
    return (
      <button
        title="Notiser blockerade – ändra i webbläsarens inställningar"
        disabled
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
      >
        <BellOff className="h-4 w-4" />
        <span className="hidden sm:inline">Notiser av</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleEnable}
      disabled={state === 'pending'}
      title="Aktivera push-notiser för ny reklam"
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors disabled:opacity-60"
    >
      <Bell className="h-4 w-4" />
      <span className="hidden sm:inline">
        {state === 'pending' ? 'Aktiverar...' : 'Notiser'}
      </span>
    </button>
  )
}
