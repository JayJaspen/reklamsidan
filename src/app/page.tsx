import Link from 'next/link'
import { Megaphone, Building2, Users, Star, Filter, Globe, ChevronRight, TrendingUp, Target, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Reklamsidan</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">
              Logga in
            </Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">
              Kom igång gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-950 to-primary-800 px-4 pb-28 pt-24 text-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Reklam du faktiskt
            <br />
            <span className="bg-gradient-to-r from-blue-300 to-primary-300 bg-clip-text text-transparent">
              vill ha
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-primary-200 leading-relaxed">
            Följ dina favoritföretag, välj kategorier du bryr dig om och ta emot
            relevant reklam direkt i din feed. Enkelt, smidigt och helt utan spam.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register/b2c"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-primary-700 shadow-lg transition hover:bg-primary-50 sm:w-auto"
            >
              <Users className="h-5 w-5" />
              Kom igång gratis
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register/b2b"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/25 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur transition hover:bg-white/20 sm:w-auto"
            >
              <Building2 className="h-5 w-5" />
              Jag är ett mottagarföretag
            </Link>
          </div>


        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">Hur fungerar det?</h2>
            <p className="text-gray-500">Tre roller – ett smart ekosystem för riktad reklam</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Building2,
                iconBg: 'bg-primary-50',
                iconColor: 'text-primary-600',
                badge: 'Annonsör',
                badgeBg: 'bg-primary-100 text-primary-700',
                title: 'Skicka reklam',
                desc: 'Ladda upp reklamblad och välj exakt vem som ska se dem – kön, ålder, region och kategori. Betala bara per faktisk läsning.',
                href: '/register/foretag',
                cta: 'Registrera företag',
              },
              {
                icon: Users,
                iconBg: 'bg-green-50',
                iconColor: 'text-green-600',
                badge: 'B2C',
                badgeBg: 'bg-green-100 text-green-700',
                title: 'Privatpersoner',
                desc: 'Följ favoritföretag och se reklam baserat på dina intressen. Allt samlat på ett ställe – inga spam-mail.',
                href: '/register/b2c',
                cta: 'Registrera dig',
              },
              {
                icon: Building2,
                iconBg: 'bg-purple-50',
                iconColor: 'text-purple-600',
                badge: 'B2B',
                badgeBg: 'bg-purple-100 text-purple-700',
                title: 'Mottagarföretag',
                desc: 'Ta emot relevant B2B-reklam från leverantörer och partners i din bransch. Filtrera efter kategori och region.',
                href: '/register/b2b',
                cta: 'Registrera företag',
              },
            ].map(({ icon: Icon, iconBg, iconColor, badge, badgeBg, title, desc, href, cta }) => (
              <div key={title} className="card flex flex-col p-8">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <span className={`mb-3 self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeBg}`}>
                  {badge}
                </span>
                <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
                <p className="mb-6 flex-1 text-gray-500 leading-relaxed">{desc}</p>
                <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
                  {cta} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-gray-50 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">Smarta funktioner</h2>
            <p className="text-gray-500">Allt du behöver för riktad digital reklam</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Star,    bg: 'bg-yellow-50', color: 'text-yellow-500', title: 'Favoriter',       desc: 'Följ dina favoritföretag och se deras senaste erbjudanden direkt i en egen flik.' },
              { icon: Target,  bg: 'bg-blue-50',   color: 'text-blue-500',   title: 'Intressereklam',  desc: 'Välj kategorier du bryr dig om och se bara relevant reklam – automatiskt filtrerat.' },
              { icon: Globe,   bg: 'bg-green-50',  color: 'text-green-500',  title: 'All reklam',      desc: 'Sök och bläddra bland alla aktiva annonsörer i hela Sverige.' },
              { icon: Filter,  bg: 'bg-purple-50', color: 'text-purple-500', title: 'Precis målgrupp', desc: 'Som annonsör väljer du exakt vem som ser din reklam – inga pengar slösas.' },
              { icon: Shield,  bg: 'bg-red-50',    color: 'text-red-500',    title: 'Ingen spam',      desc: 'Mottagarna väljer själva vad de vill se. Reklam de faktiskt läser.' },
              { icon: TrendingUp, bg: 'bg-orange-50', color: 'text-orange-500', title: 'Betala per läsning', desc: 'Som annonsör betalar du bara när din reklam faktiskt öppnas och läses.' },
            ].map(({ icon: Icon, bg, color, title, desc }) => (
              <div key={title} className="flex gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary-600 px-4 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Redo att komma igång?</h2>
          <p className="mb-10 text-lg text-primary-100">
            Det tar under 5 minuter att registrera sig. Ingen bindningstid.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register/foretag"
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-primary-700 shadow-lg transition hover:bg-primary-50">
              <Building2 className="h-5 w-5" /> Annonsera nu
            </Link>
            <Link href="/register"
              className="flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 font-bold text-white transition hover:bg-white/10">
              <Users className="h-5 w-5" /> Skapa konto
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600">
              <Megaphone className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Reklamsidan</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Reklamsidan. Alla rättigheter förbehållna.</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-700">Logga in</Link>
            <Link href="/register" className="hover:text-gray-700">Registrera</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
