import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'

const B2B_TABS = [
  { href: '/b2b/favoritreklam', label: '⭐ Favoritreklam' },
  { href: '/b2b/intresse',      label: '🎯 Intressereklam' },
  { href: '/b2b/all-reklam',    label: '🔍 All reklam' },
  { href: '/b2b/sparad',        label: '📁 Sparad reklam' },
  { href: '/b2b/favoriter',     label: '🏢 Favoriter' },
  { href: '/b2b/min-sida',      label: '🏢 Min sida' },
]

export default async function B2BLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_b2b')
    .select('company_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav tabs={B2B_TABS} userName={profile?.company_name} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
