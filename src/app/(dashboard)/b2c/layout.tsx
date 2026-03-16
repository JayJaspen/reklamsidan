export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'

const B2C_TABS = [
  { href: '/b2c/favoritreklam', label: '⭐ Favoritreklam' },
  { href: '/b2c/intresse',      label: '🎯 Intressereklam' },
  { href: '/b2c/all-reklam',    label: '🔍 All reklam' },
  { href: '/b2c/sparad',        label: '📁 Sparad reklam' },
  { href: '/b2c/favoriter',     label: '🏢 Favoriter' },
  { href: '/b2c/jobbmarknad',       label: '💼 Jobbmarknad' },
  { href: '/b2c/fastighetsportal',  label: '🏠 Fastighetsportal' },
  { href: '/b2c/min-sida',          label: '👤 Min sida' },
]

export default async function B2CLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_b2c')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  const userName = profile ? `${profile.first_name} ${profile.last_name}` : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav tabs={B2C_TABS} userName={userName} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
