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
        <p className="text-sm text-gray-400 mb-10">Senast uppdaterad: mars 2025 · Version 1.0</p>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Parter och tjänsten</h2>
            <p>
              Dessa användarvillkor ("Villkor") gäller mellan Jaspen AB, org.nr. 559XXX-XXXX, med adress
              Hejaregatan 30, 352 46 Växjö ("Reklamsidan", "vi" eller "oss") och dig som
              registrerar ett konto eller på annat sätt använder tjänsten Reklamsidan ("du" eller "Användaren").
            </p>
            <p className="mt-3">
              Reklamsidan är en digital plattform där annonsörer (företag) kan nå ut med riktad reklam
              till privatpersoner (B2C) och företagsanvändare (B2B), samt publicera jobbannonser och
              fastighets-/lokalbeskrivningar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Acceptans av villkor</h2>
            <p>
              Genom att skapa ett konto, klicka "Registrera" eller på annat sätt använda tjänsten
              bekräftar du att du har läst, förstått och accepterar dessa Villkor samt vår{' '}
              <Link href="/integritet" className="text-primary-600 hover:underline">Integritetspolicy</Link>.
            </p>
            <p className="mt-3">
              Om du ingår avtal för ett företags räkning garanterar du att du är behörig att binda
              företaget till dessa Villkor. "Du" och "Användaren" avser i sådant fall företaget.
            </p>
            <p className="mt-3">
              Om du inte godkänner Villkoren ska du omedelbart avbryta registreringen och inte använda tjänsten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Konton</h2>
            <p>
              För att använda tjänsten måste du skapa ett konto. Du ansvarar för att:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
              <li>Uppgifter du anger vid registrering är korrekta, fullständiga och hålls uppdaterade</li>
              <li>Ditt lösenord förvaras säkert och inte delas med obehöriga</li>
              <li>All aktivitet som sker via ditt konto, oavsett om den skett med eller utan ditt medgivande</li>
            </ul>
            <p className="mt-3">
              Misstänker du obehörig åtkomst ska du omedelbart meddela oss via{' '}
              <a href="mailto:info@reklamsidan.se" className="text-primary-600 hover:underline">info@reklamsidan.se</a>.
            </p>
            <p className="mt-3">
              Vi förbehåller oss rätten att stänga av eller radera konton som (i) bryter mot dessa Villkor,
              (ii) inte används under 24 månader, eller (iii) på annat sätt bedöms skadliga för tjänsten
              eller dess användare. Vid stängning av ett betalkonto återbetalas inte erlagda avgifter.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Användartyper och behörigheter</h2>
            <p>Tjänsten erbjuder tre typer av konton med olika behörigheter:</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                <p className="font-medium text-gray-800">Privatperson (B2C)</p>
                <p className="mt-1 text-gray-600">Kan ta emot reklam, följa företag, söka jobb och fastigheter. Kostnadsfritt.</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                <p className="font-medium text-gray-800">Företagsmottagare (B2B)</p>
                <p className="mt-1 text-gray-600">Kan ta emot B2B-riktad reklam, följa företag och söka i fastighetsportalen. Kostnadsfritt.</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                <p className="font-medium text-gray-800">Annonsör (Företag)</p>
                <p className="mt-1 text-gray-600">Kan publicera reklam, jobbannonser och fastighetsannonser. Debiteras kvartalsvis baserat på faktisk användning.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Innehåll och annonsregler</h2>
            <p>
              Som annonsör är du ensamt ansvarig för allt innehåll du publicerar, inklusive annonser,
              bilder, texter och bifogade filer. Du garanterar att ditt innehåll:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
              <li>Är korrekt, sanningsenligt och inte vilseledande</li>
              <li>Uppfyller tillämplig marknadsföringslagstiftning, inklusive marknadsföringslagen (2008:486)</li>
              <li>Inte kränker tredje parts immateriella rättigheter, varumärken eller upphovsrätt</li>
              <li>Inte innehåller diskriminerande, hatiskt, stötande eller olagligt material</li>
              <li>Inte marknadsför olagliga produkter, tjänster eller verksamheter</li>
              <li>Inte riktar sig olämpligt till minderåriga</li>
              <li>Inte innehåller skadlig kod, virus eller liknande</li>
            </ul>
            <p className="mt-3">
              Vi förbehåller oss rätten att – utan föregående varning och utan återbetalningsskyldighet –
              ta bort eller avpublicera innehåll som vi bedömer strider mot ovanstående regler, dessa Villkor
              eller som på annat sätt skadar plattformens rykte eller användare.
            </p>
            <p className="mt-3">
              Genom att publicera innehåll på Reklamsidan beviljar du oss en icke-exklusiv, royaltyfri,
              världsomspännande licens att lagra, visa och distribuera innehållet inom ramen för tjänstens
              funktion, inbegripet presentation av annonser för mottagare.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Priser och fakturering</h2>
            <p>Tjänsten debiteras kvartalsvis i efterskott. Priser anges alltid exklusive moms (25 %).</p>
            <div className="mt-3 overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Tjänst</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Pris (exkl. moms)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-4 py-2">Annonsläsning, B2C Favorit/Intresse</td><td className="px-4 py-2 text-right">3 kr/läsning</td></tr>
                  <tr><td className="px-4 py-2">Annonsläsning, B2C All-reklam</td><td className="px-4 py-2 text-right">1 kr/läsning</td></tr>
                  <tr><td className="px-4 py-2">Annonsläsning, B2B Favorit/Intresse</td><td className="px-4 py-2 text-right">5 kr/läsning</td></tr>
                  <tr><td className="px-4 py-2">Annonsläsning, B2B All-reklam</td><td className="px-4 py-2 text-right">3 kr/läsning</td></tr>
                  <tr><td className="px-4 py-2">Jobbannons</td><td className="px-4 py-2 text-right">1 490 kr/annons</td></tr>
                  <tr><td className="px-4 py-2">Fastighetsannons, försäljning B2C</td><td className="px-4 py-2 text-right">1 990 kr/annons</td></tr>
                  <tr><td className="px-4 py-2">Fastighetsannons, uthyrning B2C</td><td className="px-4 py-2 text-right">399 kr/annons</td></tr>
                  <tr><td className="px-4 py-2">Fastighetsannons, försäljning B2B</td><td className="px-4 py-2 text-right">2 990 kr/annons</td></tr>
                  <tr><td className="px-4 py-2">Fastighetsannons, uthyrning B2B</td><td className="px-4 py-2 text-right">2 490 kr/annons</td></tr>
                  <tr><td className="px-4 py-2">Fastighetsannonssökning (seeker)</td><td className="px-4 py-2 text-right">99 kr/sökning</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Varje unik användare debiteras maximalt en gång per annons och källa. Fakturor skickas
              till den e-postadress som angavs vid registrering. Betalningsvillkor är 30 dagar netto.
            </p>
            <p className="mt-3">
              Vi förbehåller oss rätten att justera priser med minst 30 dagars skriftligt förvarsel.
              Fortsatt användning av tjänsten efter prisändringens ikraftträdande innebär att du
              accepterar de nya priserna.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Immateriella rättigheter</h2>
            <p>
              Alla immateriella rättigheter till Reklamsidan – inklusive programvara, design, logotyper,
              varumärken och textinnehåll – ägs av Jaspen AB eller dess licensgivare och skyddas av
              tillämplig lagstiftning. Du ges en begränsad, icke-exklusiv, icke-överlåtbar licens att
              använda tjänsten för dess avsedda ändamål.
            </p>
            <p className="mt-3">
              Det är inte tillåtet att kopiera, modifiera, dekompilera, distribuera eller skapa
              härledda verk baserade på tjänsten eller delar därav utan skriftligt tillstånd från oss.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Tillgänglighet och support</h2>
            <p>
              Vi strävar efter att hålla tjänsten tillgänglig dygnet runt, men garanterar inte
              oavbruten tillgänglighet. Planerat underhåll kommuniceras i förväg. Vi förbehåller oss
              rätten att tillfälligt stänga ned tjänsten för underhåll, uppgraderingar eller vid
              säkerhetsproblem utan föregående meddelande.
            </p>
            <p className="mt-3">
              Support lämnas via e-post till{' '}
              <a href="mailto:info@reklamsidan.se" className="text-primary-600 hover:underline">info@reklamsidan.se</a>{' '}
              under svenska helgfria vardagar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Ansvarsbegränsning</h2>
            <p>
              Tjänsten tillhandahålls "i befintligt skick" utan garantier av något slag. Vi lämnar
              inga garantier avseende att tjänsten uppfyller dina specifika krav, är felfri eller
              alltid tillgänglig.
            </p>
            <p className="mt-3">
              Vi ansvarar inte för indirekta skador, följdskador, förlorad vinst, förlorade intäkter
              eller förlust av data som uppstår i samband med användningen av tjänsten, även om vi
              informerats om risken för sådana skador.
            </p>
            <p className="mt-3">
              Vårt totala samlade ansvar gentemot dig, oavsett grunden för anspråket, är begränsat
              till de avgifter du faktiskt betalat till oss under de tre (3) månader som föregick
              den händelse som gav upphov till anspråket.
            </p>
            <p className="mt-3">
              Ingenting i dessa Villkor begränsar vårt ansvar för dödsfall eller personskada orsakad
              av vårdslöshet, bedrägeri eller andra ansvar som inte kan begränsas enligt tvingande lag.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Avtalstid och uppsägning</h2>
            <p>
              Avtalet gäller från det att du registrerat ett konto och löper tillsvidare. Du kan
              när som helst begära att ditt konto stängs via e-post till{' '}
              <a href="mailto:info@reklamsidan.se" className="text-primary-600 hover:underline">info@reklamsidan.se</a>.
              Pågående faktureringsposter för innevarande kvartal kvarstår och faktureras normalt.
            </p>
            <p className="mt-3">
              Vi kan säga upp avtalet med 30 dagars skriftligt varsel till din registrerade e-postadress.
              Vid väsentligt avtalsbrott kan vi säga upp avtalet med omedelbar verkan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Ändringar av villkor</h2>
            <p>
              Vi kan komma att uppdatera dessa Villkor. Vid väsentliga ändringar informerar vi dig
              via e-post till din registrerade adress minst 14 dagar innan ändringen träder i kraft.
              Om du inte accepterar de ändrade Villkoren ska du säga upp ditt konto innan ikraftträdandet.
              Fortsatt användning av tjänsten efter ikraftträdandet innebär att du accepterar de nya Villkoren.
            </p>
            <p className="mt-3">
              Aktuell version av Villkoren finns alltid publicerad på denna sida med angivet datum.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Tillämplig lag och tvistelösning</h2>
            <p>
              Dessa Villkor regleras av och ska tolkas enligt svensk lag, utan hänsyn till lagvalsregler.
              Tvister som uppstår i anledning av dessa Villkor ska i första hand lösas genom förhandling
              i god anda. Om enighet inte kan nås inom 30 dagar ska tvisten avgöras av Stockholms
              tingsrätt som exklusivt behörig domstol i första instans.
            </p>
            <p className="mt-3">
              Konsumenter har rätt att vända sig till Allmänna reklamationsnämnden (ARN) för alternativ
              tvistelösning. Mer information finns på{' '}
              <a href="https://www.arn.se" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">www.arn.se</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">13. Kontakt</h2>
            <p>
              Frågor om dessa Villkor besvaras via{' '}
              <a href="mailto:info@reklamsidan.se" className="text-primary-600 hover:underline">info@reklamsidan.se</a>{' '}
              eller per post till Jaspen AB, Hejaregatan 30, 352 46 Växjö.
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
