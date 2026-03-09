export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'

const ADMIN_TABS = [
  { href: '/admin/anvandare', label: '👥 Användare' },
  { href: '/admin/foretag',   label: '🏢 Företag' },
  { href: '/admin/fakturering', label: '💰 Fakturering' },
  { href: '/admin/kategorier', label: '🏷️ Kategorier' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verifiera att det är admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav tabs={ADMIN_TABS} userName="Admin" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
