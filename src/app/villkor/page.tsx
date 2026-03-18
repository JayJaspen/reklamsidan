import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Användarvillkor – Reklamsidan',
  description: 'Läs Reklamsidens användarvillkor.',
}

export default function VillkorPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Reklamsidan" width={140} height={42} className="h-9 w-auto" />
          </Link>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-700">Logga in</Link>
            <Link href="/register" className="hover:text-gray-700">Registrera</Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Användarvillkor</h1>
        <p className="text-sm text-gray-400 mb-10">Senast uppdaterad: mars 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Om tjänsten</h2>
            <p>
              Reklamsidan är en digital reklamplattform som tillhandahålls av Jaspen AB (org.nr. [FYLL I]),
              nedan kallat "vi", "oss" eller "Reklamsidan". Tjänsten möjliggör för företag att publicera
              riktad reklam till privatpersoner och B2B-mottagare, samt att annonsera lediga tjänster och
              fastigheter/lokaler.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Acceptans av villkor</h2>
            <p>
              Genom att registrera ett konto eller använda Reklamsidan godkänner du dessa användarvillkor
              i sin helhet. Om du inte accepterar villkoren ska du inte använda tjänsten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Konton och registrering</h2>
            <p>
              Du ansvarar för att de uppgifter du anger vid registrering är korrekta och aktuella.
              Du ansvarar för att hålla ditt lösenord hemligt och för all aktivitet som sker via ditt konto.
              Kontakta oss omedelbart om du misstänker obehörig åtkomst till ditt konto.
            </p>
            <p className="mt-3">
              Vi förbehåller oss rätten att stänga av eller radera konton som bryter mot dessa villkor
              eller på annat sätt missbrukar tjänsten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Annonsering och innehåll</h2>
            <p>
              Företag som publicerar annonser ansvarar för att innehållet är korrekt, lagligt och inte
              vilseledande. Det är inte tillåtet att publicera annonser som:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Innehåller diskriminerande, stötande eller olagligt material</li>
              <li>Gör falska eller missvisande påståenden</li>
              <li>Bryter mot upphovsrätt eller andra immateriella rättigheter</li>
              <li>Marknadsför olagliga produkter eller tjänster</li>
              <li>Riktar sig olämpligt till minderåriga</li>
            </ul>
            <p className="mt-3">
              Vi förbehåller oss rätten att ta bort annonser som inte uppfyller ovanstående krav,
              utan föregående varning och utan återbetalning av eventuella avgifter.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Priser och fakturering</h2>
            <p>
              Tjänsten debiteras kvartalsvis i efterskott baserat på faktisk användning.
              Priser anges exklusive moms (25 %). Fakturor skickas till den e-postadress
              som angavs vid registrering. Betalningsvillkor är 30 dagar netto.
            </p>
            <p className="mt-3">
              Aktuell prislista finns tillgänglig i ditt konto under Fakturor. Vi förbehåller oss
              rätten att justera priser med minst 30 dagars skriftligt förvarsel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Immateriella rättigheter</h2>
            <p>
              Allt material på Reklamsidan – inklusive design, kod, logotyper och text – ägs av
              Jaspen AB eller dess licensgivare. Du får inte kopiera, reproducera eller distribuera
              detta material utan skriftligt tillstånd.
            </p>
            <p className="mt-3">
              Genom att ladda upp material till Reklamsidan beviljar du oss en icke-exklusiv,
              royaltyfri licens att använda, visa och distribuera materialet inom ramen för tjänsten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Ansvarsbegränsning</h2>
            <p>
              Reklamsidan tillhandahålls i befintligt skick. Vi garanterar inte att tjänsten är
              felfri eller alltid tillgänglig. Vi ansvarar inte för indirekta skador, förlorad vinst
              eller data som uppstår till följd av användning av tjänsten.
            </p>
            <p className="mt-3">
              Vårt totala ansvar gentemot dig är begränsat till de avgifter du betalat till oss
              under de senaste tre månaderna.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Ändringar av villkor</h2>
            <p>
              Vi kan komma att uppdatera dessa villkor. Vid väsentliga ändringar informerar vi
              registrerade användare via e-post minst 14 dagar i förväg. Fortsatt användning av
              tjänsten efter ikraftträdande innebär att du accepterar de nya villkoren.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Tillämplig lag</h2>
            <p>
              Dessa villkor regleras av svensk lag. Tvister ska i första hand lösas genom förhandling.
              Om enighet inte kan nås är Stockholms tingsrätt exklusivt behörig domstol.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Kontakt</h2>
            <p>
              Frågor om dessa villkor besvaras via{' '}
              <a href="mailto:info@reklamsidan.se" className="text-primary-600 hover:underline">
                info@reklamsidan.se
              </a>{' '}
              eller per post till Jaspen AB, [ADRESS], [POSTNUMMER] [STAD].
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-4 py-8 mt-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/">
            <Image src="/logo.png" alt="Reklamsidan" width={140} height={42} className="h-9 w-auto" />
          </Link>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Reklamsidan. Alla rättigheter förbehållna.</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/villkor" className="hover:text-gray-700 font-medium text-gray-700">Villkor</Link>
            <Link href="/integritet" className="hover:text-gray-700">Integritetspolicy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
