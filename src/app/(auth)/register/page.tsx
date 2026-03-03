import Link from 'next/link'
import { Users, Building2, Briefcase, ChevronRight } from 'lucide-react'

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
    <div className="p-8 sm:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Skapa konto</h1>
        <p className="mt-1 text-sm text-gray-500">Välj vilken typ av konto du vill skapa</p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map(({ href, icon: Icon, color, title, desc, badge, badgeColor }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-all duration-150 hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-sm"
          >
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-105`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{title}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>
                  {badge}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-400" />
          </Link>
        ))}
      </div>

      <div className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
        Har du redan ett konto?{' '}
        <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          Logga in
        </Link>
      </div>
    </div>
  )
}
