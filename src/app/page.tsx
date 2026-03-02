import Link from 'next/link'
import { Megaphone, Building2, Users, Star, Filter, Globe } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Reklamsidan</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">
              Logga in
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Registrera dig
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-4 py-24 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight">
            Digital reklam som når<br />
            <span className="text-primary-300">rätt mottagare</span>
          </h1>
          <p className="mb-10 text-xl text-primary-100">
            Skicka riktad reklam till privatpersoner och företag som faktiskt är intresserade.
            Betala bara för läst reklam.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register/foretag"
              className="w-full rounded-xl bg-white px-8 py-4 text-center text-base font-bold text-primary-700 shadow-lg transition hover:bg-primary-50 sm:w-auto"
            >
              Annonsera som företag
            </Link>
            <Link
              href="/register/b2c"
              className="w-full rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-center text-base font-bold text-white backdrop-blur transition hover:bg-white/20 sm:w-auto"
            >
              Registrera dig som privatperson
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            Hur fungerar det?
          </h2>
          <p className="mb-14 text-center text-gray-500">
            Tre enkla roller – ett smart system
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Card 1 */}
            <div className="card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <Building2 className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Annonsörföretag</h3>
              <p className="mb-4 text-gray-500 leading-relaxed">
                Ladda upp dina reklamblad och välj exakt vem som ska se dem – kön, ålder,
                län och intressekategori. Du betalar bara när någon faktiskt läser din reklam.
              </p>
              <Link href="/register/foretag" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                Registrera företag →
              </Link>
            </div>
            {/* Card 2 */}
            <div className="card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Privatpersoner (B2C)</h3>
              <p className="mb-4 text-gray-500 leading-relaxed">
                Följ dina favoritföretag och se reklam baserat på dina intressen.
                Allt på ett ställe – inga spam-mail.
              </p>
              <Link href="/register/b2c" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                Registrera dig →
              </Link>
            </div>
            {/* Card 3 */}
            <div className="card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Mottagarföretag (B2B)</h3>
              <p className="mb-4 text-gray-500 leading-relaxed">
                Ta emot relevant B2B-reklam från leverantörer och partners i din bransch.
                Filtrera efter kategori och region.
              </p>
              <Link href="/register/b2b" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                Registrera företag →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-14 text-center text-3xl font-bold text-gray-900">
            Smarta funktioner för alla
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Star,   color: 'text-yellow-500 bg-yellow-50', title: 'Favoriter',       desc: 'Följ dina favoritföretag och se deras senaste erbjudanden direkt.' },
              { icon: Filter, color: 'text-blue-500 bg-blue-50',    title: 'Intressereklam',   desc: 'Välj kategorier du bryr dig om – se bara relevant reklam.' },
              { icon: Globe,  color: 'text-green-500 bg-green-50',  title: 'All reklam',       desc: 'Sök efter specifika företag eller branscher i hela Sverige.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 px-4 py-16 text-center text-white">
        <h2 className="mb-4 text-3xl font-bold">Redo att komma igång?</h2>
        <p className="mb-8 text-primary-100">Det tar under 5 minuter att registrera sig.</p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/register" className="rounded-xl bg-white px-8 py-3 font-bold text-primary-700 hover:bg-primary-50">
            Skapa konto
          </Link>
          <Link href="/login" className="rounded-xl border-2 border-white/40 px-8 py-3 font-bold text-white hover:bg-white/10">
            Logga in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-4 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Reklamsidan. Alla rättigheter förbehållna.
      </footer>
    </div>
  )
}
