import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'

const FORETAG_TABS = [
  { href: '/foretag/statistik',      label: '📊 Statistik' },
  { href: '/foretag/skicka-reklam',  label: '📤 Skicka reklam' },
  { href: '/foretag/min-sida',       label: '⚙️ Min sida' },
]

export default async function ForetagLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('public_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav tabs={FORETAG_TABS} userName={company?.public_name} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
