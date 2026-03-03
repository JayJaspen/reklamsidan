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

function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 shadow-sm group-hover:bg-primary-700 transition-colors">
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 hidden sm:block">Reklamsidan</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {userName && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                  {getInitials(userName)}
                </div>
                <span className="text-sm text-gray-600 font-medium">{userName}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="Logga ut"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logga ut</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'whitespace-nowrap border-b-2 px-3 pb-3 pt-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'border-primary-600 text-primary-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
