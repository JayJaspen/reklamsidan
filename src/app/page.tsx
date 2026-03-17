'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Building2, Users, Star, Filter, Globe, ChevronRight, TrendingUp, Target, Shield, Mail, Send, CheckCircle, Briefcase, Home, Search, Bell } from 'lucide-react'

const STATS_THRESHOLD = 100

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
            else setCount(target)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

function StatCard({ value, label, icon: Icon, iconBg }: {
  value: number; label: string; icon: React.ElementType; iconBg: string
}) {
  const { count, ref } = useCountUp(value)
  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}>
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-5xl font-extrabold text-white tabular-nums">
        {count.toLocaleString('sv-SE')}+
      </p>
      <p className="text-sm font-medium text-primary-200 text-center">{label}</p>
    </div>
  )
}

type Stats = { companies: number; b2c_users: number; b2b_users: number }

function SaFungerarSection() {
  const [activeTab, setActiveTab] = useState<'mottagare' | 'avsandare'>('mottagare')

  return (
    <section id="sa-fungerar" className="bg-gray-50 px-4 py-24">
      <div className="mx-auto max-w-4xl">
        {/* Rubrik */}
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gray-900">Så fungerar Reklamsidan</h2>
          <p className="text-gray-500">Välj din roll för att se hur plattformen fungerar för dig</p>
        </div>

        {/* Flikar */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
            <button
              onClick={() => setActiveTab('mottagare')}
              className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'mottagare'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Jag är mottagare
            </button>
            <button
              onClick={() => setActiveTab('avsandare')}
              className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'avsandare'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Jag är avsändare
            </button>
          </div>
        </div>

        {/* Innehåll – Mottagare */}
        {activeTab === 'mottagare' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Som mottagare av reklam</h3>
                  <p className="text-sm text-gray-500">Privatperson (B2C) eller företag (B2B)</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  {
                    step: '1',
                    icon: Users,
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                    title: 'Skapa ett konto',
                    desc: 'Registrera dig gratis som privatperson (B2C) eller som ett mottagarföretag (B2B). Det tar bara några minuter.',
                  },
                  {
                    step: '2',
                    icon: Star,
                    color: 'text-yellow-600',
                    bg: 'bg-yellow-50',
                    title: 'Välj dina favoriter',
                    desc: 'Följ de företag du gillar under fliken "Favoriter". Deras reklam visas alltid i din favoritfeed – direkt och enkelt.',
                  },
                  {
                    step: '3',
                    icon: Target,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    title: 'Välj dina intressen',
                    desc: 'Ange kategorier som intresserar dig (t.ex. mat, bygg, mode). Reklam från matchande företag hamnar automatiskt under "Intressereklam".',
                  },
                  {
                    step: '4',
                    icon: Globe,
                    color: 'text-purple-600',
                    bg: 'bg-purple-50',
                    title: 'Utforska all reklam',
                    desc: 'Under "All reklam" ser du alla aktiva annonsörer i Sverige. Filtrera på län och kategori för att hitta lokal reklam.',
                  },
                ].map(({ step, icon: Icon, color, bg, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/register/b2c" className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 transition text-sm">
                  <Users className="h-4 w-4" /> Registrera som privatperson
                </Link>
                <Link href="/register/b2b" className="flex items-center justify-center gap-2 rounded-xl border-2 border-green-600 px-6 py-3 font-semibold text-green-700 hover:bg-green-50 transition text-sm">
                  <Building2 className="h-4 w-4" /> Registrera som B2B-mottagare
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Innehåll – Avsändare */}
        {activeTab === 'avsandare' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Som avsändare av reklam</h3>
                  <p className="text-sm text-gray-500">Annonsör – du skickar reklam, jobbannonser och fastighetsannonser</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  {
                    step: '1',
                    icon: Building2,
                    color: 'text-primary-600',
                    bg: 'bg-primary-50',
                    title: 'Registrera ditt företag',
                    desc: 'Skapa ett företagskonto med din logotyp, beskrivning och kontaktuppgifter. Välj om du riktar dig mot B2C, B2B eller båda.',
                  },
                  {
                    step: '2',
                    icon: Filter,
                    color: 'text-orange-600',
                    bg: 'bg-orange-50',
                    title: 'Definiera din målgrupp',
                    desc: 'Välj vilka kategorier dina annonser ska nå, i vilka län och om du riktar dig mot privatpersoner eller företag.',
                  },
                  {
                    step: '3',
                    icon: TrendingUp,
                    color: 'text-teal-600',
                    bg: 'bg-teal-50',
                    title: 'Ladda upp reklamblad',
                    desc: 'Ladda upp dina reklamblad som PDF, bild eller video. Annonsen visas för rätt mottagare i deras favorit- eller intressefeed.',
                  },
                  {
                    step: '4',
                    icon: Shield,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    title: 'Betala per faktisk läsning',
                    desc: 'Du faktureras kvartalsvis baserat på hur många användare som faktiskt öppnat din annons. Inga dolda kostnader.',
                  },
                ].map(({ step, icon: Icon, color, bg, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl bg-primary-50 p-4">
                <p className="text-sm font-semibold text-primary-800 mb-1">Prissättning</p>
                <div className="grid gap-1 sm:grid-cols-2 text-xs text-primary-700">
                  <span>• Favoriter B2C: 3 kr / läsning</span>
                  <span>• Favoriter B2B: 5 kr / läsning</span>
                  <span>• Intressereklam B2C: 3 kr / läsning</span>
                  <span>• Intressereklam B2B: 5 kr / läsning</span>
                  <span>• All reklam B2C: 1 kr / läsning</span>
                  <span>• All reklam B2B: 3 kr / läsning</span>
                </div>
                <p className="mt-2 text-xs text-primary-600">Alla priser är exkl. moms. Fakturering sker kvartalsvis.</p>
              </div>
              <div className="mt-6">
                <Link href="/register/foretag" className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700 transition text-sm w-full sm:w-auto sm:inline-flex">
                  <Building2 className="h-4 w-4" /> Registrera ditt företag gratis
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default function LandingPage() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactState, setContactState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then((s: Stats) => {
        // Visa bara om ALLA tre har nått tröskeln
        if (
          s.companies  >= STATS_THRESHOLD &&
          s.b2c_users  >= STATS_THRESHOLD &&
          s.b2b_users  >= STATS_THRESHOLD
        ) {
          setStats(s)
        }
      })
      .catch(() => {})
  }, [])

  async function handleContact(e: React.FormEvent) {
    e.preventDefault()
    setContactState('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      if (res.ok) {
        setContactState('sent')
        setContactForm({ name: '', email: '', message: '' })
      } else {
        setContactState('error')
      }
    } catch {
      setContactState('error')
    }
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="wecq Reklamsidan"
              width={200}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </div>
          <div className="flex items-center gap-3">
            <a href="#sa-fungerar" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              Så fungerar det
            </a>
            <a href="#kontakta-oss" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              Kontakta oss
            </a>
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
              href="/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-primary-700 shadow-lg transition hover:bg-primary-50 sm:w-auto"
            >
              <Users className="h-5 w-5" />
              Kom igång gratis
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>


        </div>
      </section>

      {/* ── Stats ── */}
      {stats && (
        <section className="bg-primary-800 px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-3 gap-8 sm:gap-16">
              <StatCard
                value={stats.companies}
                label="Annonsörer"
                icon={Building2}
                iconBg="bg-white/10"
              />
              <StatCard
                value={stats.b2c_users}
                label="Privatpersoner"
                icon={Users}
                iconBg="bg-white/10"
              />
              <StatCard
                value={stats.b2b_users}
                label="B2B-mottagare"
                icon={Building2}
                iconBg="bg-white/10"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Så fungerar Reklamsidan ── */}
      <SaFungerarSection />

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
              { icon: Star,       bg: 'bg-yellow-50',  color: 'text-yellow-500',  title: 'Favoriter',          desc: 'Följ dina favoritföretag och se deras senaste erbjudanden direkt i en egen flik.' },
              { icon: Target,     bg: 'bg-blue-50',    color: 'text-blue-500',    title: 'Intressereklam',     desc: 'Välj kategorier du bryr dig om och se bara relevant reklam – automatiskt filtrerat.' },
              { icon: Globe,      bg: 'bg-green-50',   color: 'text-green-500',   title: 'All reklam',         desc: 'Sök och bläddra bland alla aktiva annonsörer i hela Sverige.' },
              { icon: Filter,     bg: 'bg-purple-50',  color: 'text-purple-500',  title: 'Precis målgrupp',    desc: 'Som annonsör väljer du exakt vem som ser din reklam – inga pengar slösas.' },
              { icon: Shield,     bg: 'bg-red-50',     color: 'text-red-500',     title: 'Ingen spam',         desc: 'Mottagarna väljer själva vad de vill se. Reklam de faktiskt läser.' },
              { icon: TrendingUp, bg: 'bg-orange-50',  color: 'text-orange-500',  title: 'Betala per läsning', desc: 'Som annonsör betalar du bara när din reklam faktiskt öppnas och läses.' },
              { icon: Briefcase,  bg: 'bg-sky-50',     color: 'text-sky-500',     title: 'Jobbmarknaden',      desc: 'Annonsörer publicerar lediga tjänster direkt på plattformen – användare hittar jobb från sina favoritföretag.' },
              { icon: Home,       bg: 'bg-emerald-50', color: 'text-emerald-500', title: 'Fastighetsportalen', desc: 'Annonsera bostäder och lokaler till försäljning eller uthyrning. Intresserade söker, sparar bevakningar och kontaktar direkt.' },
              { icon: Bell,       bg: 'bg-pink-50',    color: 'text-pink-500',    title: 'Bevakningar',        desc: 'Sätt upp bevakningar för jobb och fastigheter – få relevanta träffar samlade utan att behöva söka om.' },
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

      {/* ── Jobbmarknaden ── */}
      <section className="px-4 py-24 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="mb-4 inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">Jobbmarknaden</span>
              <h2 className="mb-4 text-3xl font-bold text-gray-900 leading-tight">
                Hitta rätt kandidat –<br />eller rätt jobb
              </h2>
              <p className="mb-6 text-gray-500 leading-relaxed">
                Annonsörer på plattformen kan publicera lediga tjänster direkt i sin profil. Användare som följer företaget ser jobbannonsen automatiskt i sin feed – utan extra sökning.
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  { icon: Briefcase, text: 'Annonsörer: publicera jobbannonser med deadline, lön och beskrivning' },
                  { icon: Bell,      text: 'Användare: aktivera jobbnotiser per favoritföretag' },
                  { icon: Search,    text: 'Sök och filtrera bland alla lediga tjänster på plattformen' },
                  { icon: Filter,    text: 'Rikta annonsen mot rätt region och målgrupp' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100">
                      <Icon className="h-3 w-3 text-sky-600" />
                    </div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 p-8">
              <div className="space-y-3">
                {[
                  { title: 'Kundtjänstmedarbetare', company: 'Företag AB', loc: 'Malmö', type: 'Heltid' },
                  { title: 'Junior redovisningsekonom', company: 'Redovisning & Co', loc: 'Stockholm', type: 'Heltid' },
                  { title: 'Säljare B2B', company: 'Försäljning Nord', loc: 'Sundsvall', type: 'Heltid' },
                ].map((job, i) => (
                  <div key={i} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-sky-100">
                    <p className="font-semibold text-gray-900 text-sm">{job.title}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{job.company}</span>
                      <span>{job.loc}</span>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700 font-medium">{job.type}</span>
                    </div>
                  </div>
                ))}
                <p className="text-center text-xs text-sky-500 font-medium pt-1">Exempel på jobbannonser</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fastighetsportalen ── */}
      <section className="bg-gray-50 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 p-8">
              <div className="space-y-3">
                {[
                  { title: '3:a på Storgatan 12', badge: 'Uthyrning', price: '9 500 kr/mån', detail: '72 kvm · 3 rum · Göteborg' },
                  { title: 'Villa Ekåsen', badge: 'Försäljning', price: '3 250 000 kr', detail: '145 kvm · 5 rum · Västerås' },
                  { title: 'Kontorslokal centralt', badge: 'Uthyrning', price: '18 000 kr/mån', detail: '210 kvm · Lagerlokal · Malmö' },
                ].map((prop, i) => (
                  <div key={i} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{prop.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${prop.badge === 'Försäljning' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{prop.badge}</span>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-emerald-700">{prop.price}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{prop.detail}</p>
                  </div>
                ))}
                <p className="text-center text-xs text-emerald-500 font-medium pt-1">Exempel på fastighetsannonser</p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="mb-4 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Fastighetsportalen</span>
              <h2 className="mb-4 text-3xl font-bold text-gray-900 leading-tight">
                Bostäder, lokaler och<br />fastigheter – på ett ställe
              </h2>
              <p className="mb-6 text-gray-500 leading-relaxed">
                Annonsörer kan publicera fastigheter till försäljning eller uthyrning. Privatpersoner och företag söker, filtrerar och sparar bevakningar. Sökes-annonser kopplar köpare direkt till säljare.
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  { icon: Home,      text: 'Annonsörer: publicera bostäder (villor, lägenheter, radhus, tomter) och lokaler' },
                  { icon: Search,    text: 'Användare: sök med filter på typ, pris, rum, storlek och region' },
                  { icon: Bell,      text: 'Spara bevakningar – matchande annonser visas automatiskt' },
                  { icon: Users,     text: 'Lägg upp sökes-annons och nå säljare direkt för 99 kr' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Icon className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
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

      {/* ── Kontakta oss ── */}
      <section id="kontakta-oss" className="px-4 py-24 bg-white">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
              <Mail className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900">Kontakta oss</h2>
            <p className="text-gray-500">Har du frågor eller vill veta mer? Vi svarar så snart vi kan.</p>
          </div>

          {contactState === 'sent' ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-200 bg-green-50 py-16 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">Meddelandet är skickat!</h3>
              <p className="text-sm text-gray-500">Vi återkommer till dig så snart som möjligt.</p>
              <button
                onClick={() => setContactState('idle')}
                className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Skicka ett till
              </button>
            </div>
          ) : (
            <form onSubmit={handleContact} className="card p-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Namn</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ditt namn"
                  value={contactForm.name}
                  onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">E-postadress</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="din@epost.se"
                  value={contactForm.email}
                  onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Meddelande</label>
                <textarea
                  required
                  rows={5}
                  className="input-field resize-none"
                  placeholder="Skriv ditt meddelande här..."
                  value={contactForm.message}
                  onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>

              {contactState === 'error' && (
                <p className="text-sm text-red-600">Något gick fel. Försök igen eller maila oss direkt på info@reklamsidan.se.</p>
              )}

              <button
                type="submit"
                disabled={contactState === 'sending'}
                className="btn-primary w-full gap-2 py-3"
              >
                <Send className="h-4 w-4" />
                {contactState === 'sending' ? 'Skickar...' : 'Skicka meddelande'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center">
            <Image src="/logo.png" alt="wecq Reklamsidan" width={160} height={48} className="h-10 w-auto" />
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Reklamsidan. Alla rättigheter förbehållna.</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-700">Logga in</Link>
            <Link href="/register" className="hover:text-gray-700">Registrera</Link>
            <a href="#kontakta-oss" className="hover:text-gray-700">Kontakta oss</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
