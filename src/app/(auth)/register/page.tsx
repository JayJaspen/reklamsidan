import Link from 'next/link'
import { Users, Building2, Briefcase } from 'lucide-react'

const OPTIONS = [
  {
    href:  '/register/b2c',
    icon:  Users,
    color: 'bg-green-50 text-green-600',
    title: 'Privatperson',
    desc:  'Jag vill följa företag och ta emot reklam anpassad för mig.',
    badge: 'B2C',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    href:  '/register/b2b',
    icon:  Briefcase,
    color: 'bg-purple-50 text-purple-600',
    title: 'Företag – ta emot reklam',
    desc:  'Jag representerar ett företag som vill ta emot B2B-reklam från leverantörer.',
    badge: 'B2B',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    href:  '/register/foretag',
    icon:  Building2,
    color: 'bg-blue-50 text-blue-600',
    title: 'Företag – skicka reklam',
    desc:  'Jag representerar ett företag som vill annonsera till kunder och andra företag.',
    badge: 'Annonsör',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
]

export default function RegisterPage() {
  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Skapa konto</h1>
      <p className="mb-6 text-sm text-gray-500">Välj vilken typ av konto du vill skapa</p>

      <div className="space-y-3">
        {OPTIONS.map(({ href, icon: Icon, color, title, desc, badge, badgeColor }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-4 rounded-xl border border-gray-200 p-4 transition hover:border-primary-300 hover:bg-primary-50/30"
          >
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{title}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeColor}`}>
                  {badge}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">{desc}</p>
            </div>
            <span className="text-gray-400">›</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
        Har du redan ett konto?{' '}
        <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
          Logga in
        </Link>
      </div>
    </div>
  )
}
