'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Tab {
  href: string
  label: string
}

interface Props {
  tabs: Tab[]
  userName?: string
}

export default function DashboardNav({ tabs, userName }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-bold text-gray-900">Reklamsidan</span>
          </div>
          <div className="flex items-center gap-4">
            {userName && (
              <span className="hidden text-sm text-gray-500 sm:block">{userName}</span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logga ut</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {tabs.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors',
                  isActive ? 'tab-active' : 'tab-inactive'
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
