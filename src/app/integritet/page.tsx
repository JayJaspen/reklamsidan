import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Integritetspolicy – Reklamsidan',
  description: 'Läs om hur Reklamsidan hanterar dina personuppgifter enligt GDPR.',
}

export default function IntegritetPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integritetspolicy</h1>
        <p className="text-sm text-gray-400 mb-2">Senast uppdaterad: mars 2025 · Version 1.0</p>
        <p className="text-sm text-gray-500 mb-10">
          Denna policy beskriver hur Reklamsidan behandlar dina personuppgifter i enlighet med
          EU:s dataskyddsförordning (GDPR, förordning 2016/679).
        </p>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Personuppgiftsansvarig</h2>
            <p>
              Jaspen AB, org.nr. 559XXX-XXXX ("Reklamsidan", "vi" eller "oss"), är
              personuppgiftsansvarig för behandlingen av dina personuppgifter.
            </p>
            <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm space-y-1">
              <p><strong>Företag:</strong> Jaspen AB</p>
              <p><strong>Adress:</strong> Hejaregatan 30, 352 46 Växjö</p>
              <p><strong>E-post:</strong>{' '}
                <a href="mailto:info@reklamsidan.se" className="text-primary-600 hover:underline">info@reklamsidan.se</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Vilka uppgifter samlar vi in?</h2>
            <p>Vi samlar in personuppgifter i följande kategorier:</p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Kontouppgifter</p>
                <p className="mt-1 text-gray-600">E-postadress, krypterat lösenord, kontoroll (privatperson / B2B / annonsör), registreringsdatum.</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Profiluppgifter (privatperson/B2B)</p>
                <p className="mt-1 text-gray-600">Förnamn, efternamn, ålder, kön, hemort/bostadsort, intressekategorier, valda favoritföretag, push-notis-preferenser.</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Företagsuppgifter (annonsörer)</p>
                <p className="mt-1 text-gray-600">Företagsnamn, organisationsnummer, logotyp, kontaktuppgifter, faktureringsadress, servicelän.</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Användnings- och interaktionsdata</p>
                <p className="mt-1 text-gray-600">Vilka annonser du sett, interagerat med, sparat eller markerat som favorit. Tidpunkt och källa (fliken du befann dig på) för varje läsning.</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Push-notiser</p>
                <p className="mt-1 text-gray-600">En anonymiserad enhetstoken (webb-push-prenumeration) som genereras av din webbläsare om du godkänner notiser.</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Kommunikation</p>
                <p className="mt-1 text-gray-600">Namn, e-postadress och meddelande om du kontaktar oss via kontaktformuläret på webbplatsen.</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Vi samlar inte in känsliga personuppgifter (t.ex. hälsouppgifter, politiska åsikter
              eller etniskt ursprung) och vi ber dig aldrig uppge sådana uppgifter i tjänsten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Ändamål och rättsliga grunder</h2>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">Tillhandahålla och administrera tjänsten</p>
                    <p className="mt-1 text-gray-600">Hantera inloggning, visa anpassad reklam baserat på dina intressen och valda kategorier, tillhandahålla jobb- och fastighetsportalen.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Avtal (6.1 b)</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">Fakturering och bokföring</p>
                    <p className="mt-1 text-gray-600">Registrera annonsläsningar per användare och annons, beräkna kvartalsvis faktura, uppfylla krav i bokföringslagen (7 år).</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Avtal + rättslig förpliktelse (6.1 b, c)</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">Push-notiser om ny reklam och jobb</p>
                    <p className="mt-1 text-gray-600">Skicka webbaserade push-notiser från dina favoritföretag om du aktiverat detta.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Samtycke (6.1 a)</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">Säkerhet och missbruksskydd</p>
                    <p className="mt-1 text-gray-600">Logga in/ut-händelser, begränsa felinloggningsförsök, skydda tjänsten mot missbruk och obehörig åtkomst.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">Berättigat intresse (6.1 f)</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">Statistik och förbättring av tjänsten</p>
                    <p className="mt-1 text-gray-600">Aggregerad, anonymiserad statistik för att förbättra användarupplevelsen och tjänstens funktion. Inga enskilda användare identifieras.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">Berättigat intresse (6.1 f)</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">Svar på kontaktmeddelanden</p>
                    <p className="mt-1 text-gray-600">Behandla och besvara frågor som inkommit via kontaktformuläret.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">Berättigat intresse (6.1 f)</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Lagringstider</h2>
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Uppgiftskategori</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Lagringstid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-4 py-2">Kontouppgifter och profil</td><td className="px-4 py-2 text-right">Så länge kontot är aktivt, därefter 12 månader</td></tr>
                  <tr><td className="px-4 py-2">Fakturaunderlag</td><td className="px-4 py-2 text-right">7 år (bokföringslagens krav)</td></tr>
                  <tr><td className="px-4 py-2">Annonsläsningsdata</td><td className="px-4 py-2 text-right">24 månader rullande</td></tr>
                  <tr><td className="px-4 py-2">Push-notis-token</td><td className="px-4 py-2 text-right">Tills du återkallar samtycket</td></tr>
                  <tr><td className="px-4 py-2">Kontaktformulär-meddelanden</td><td className="px-4 py-2 text-right">12 månader</td></tr>
                  <tr><td className="px-4 py-2">Säkerhetsloggar</td><td className="px-4 py-2 text-right">90 dagar</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Mottagare och underleverantörer</h2>
            <p>
              Vi delar inte dina personuppgifter med tredje part för deras marknadsföringssyften.
              Uppgifterna kan delas med följande kategorier av mottagare:
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Supabase Inc. — databas och autentisering</p>
                <p className="mt-1 text-gray-600">Lagring av all användardata och autentiseringstjänst. Data lagras i EU-region (Frankfurt). Databehandlaravtal tecknat.</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Vercel Inc. — hosting och CDN</p>
                <p className="mt-1 text-gray-600">Driftsättning av webbapplikationen. Ingen användardata lagras permanent hos Vercel. Standardavtalsklausuler (SCC) tillämpas.</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Resend Inc. — transaktionell e-post</p>
                <p className="mt-1 text-gray-600">Vidarebefordran av kontaktformulär-meddelanden till vår e-postadress. Databehandlaravtal tecknat.</p>
              </div>
            </div>
            <p className="mt-4 text-sm">
              Alla underleverantörer är bundna av konfidentialitetskrav och GDPR-kompatibla avtal.
              Vi kan komma att lämna ut uppgifter om det krävs enligt lag eller myndighetsbeslut.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Överföring utanför EU/EES</h2>
            <p>
              Supabase lagrar data inom EU (Frankfurt). Vercel och Resend är amerikanska bolag som
              kan behandla data utanför EU/EES. Överföringen sker med stöd av EU-kommissionens
              standardavtalsklausuler (SCC, art. 46 GDPR) och, där tillämpligt, EU-US Data Privacy Framework.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Dina rättigheter</h2>
            <p>Enligt GDPR har du följande rättigheter. Kontakta oss på{' '}
              <a href="mailto:info@reklamsidan.se" className="text-primary-600 hover:underline">info@reklamsidan.se</a>{' '}
              för att utöva dem. Vi svarar inom 30 dagar.
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="shrink-0 font-semibold text-gray-900 w-40">Rätt till tillgång</span>
                <span className="text-gray-600">Begär ett registerutdrag med de uppgifter vi har om dig (art. 15).</span>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 font-semibold text-gray-900 w-40">Rätt till rättelse</span>
                <span className="text-gray-600">Begär att felaktiga eller ofullständiga uppgifter korrigeras (art. 16).</span>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 font-semibold text-gray-900 w-40">Rätt till radering</span>
                <span className="text-gray-600">Begär att dina uppgifter raderas ("rätten att bli glömd"), om inte lagkrav hindrar detta (art. 17).</span>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 font-semibold text-gray-900 w-40">Rätt till begränsning</span>
                <span className="text-gray-600">Begär att vi begränsar behandlingen, t.ex. under en tvist om uppgifternas korrekthet (art. 18).</span>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 font-semibold text-gray-900 w-40">Dataportabilitet</span>
                <span className="text-gray-600">Begär att vi lämnar ut dina uppgifter i ett strukturerat, maskinläsbart format (art. 20).</span>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 font-semibold text-gray-900 w-40">Rätt att invända</span>
                <span className="text-gray-600">Invänd mot behandling som grundar sig på berättigat intresse (art. 21).</span>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 font-semibold text-gray-900 w-40">Återkalla samtycke</span>
                <span className="text-gray-600">Återkalla samtycke till push-notiser när som helst i dina webbläsarinställningar eller i kontoinställningarna.</span>
              </div>
            </div>
            <p className="mt-4 text-sm">
              Du har rätt att lämna klagomål till tillsynsmyndigheten{' '}
              <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                Integritetsskyddsmyndigheten (IMY)
              </a>{' '}
              om du anser att vi behandlar dina uppgifter felaktigt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Cookies och spårning</h2>
            <p>
              Reklamsidan använder <strong>enbart nödvändiga session-cookies</strong> för autentisering
              och sessionshantering. Dessa cookies är oundgängliga för att tjänsten ska fungera och
              kräver inget separat samtycke enligt lagen om elektronisk kommunikation (LEK).
            </p>
            <p className="mt-3">
              Vi använder <strong>inga</strong> analys-cookies, reklam-cookies eller tredjepartscookies
              för spårning av användarbeteende utanför tjänsten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Säkerhet</h2>
            <p>
              Vi vidtar lämpliga tekniska och organisatoriska åtgärder för att skydda dina uppgifter:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
              <li>All kommunikation krypteras med TLS/HTTPS</li>
              <li>Lösenord lagras aldrig i klartext (bcrypt-hashing via Supabase Auth)</li>
              <li>Rollbaserad åtkomstkontroll — användare kan bara komma åt sina egna uppgifter (Row Level Security)</li>
              <li>Sessioner förfaller automatiskt (5 timmar standard, 30 dagar med "kom ihåg mig")</li>
              <li>Regelbundna säkerhetsuppdateringar av beroenden</li>
            </ul>
            <p className="mt-3 text-sm">
              Vid en personuppgiftsincident som sannolikt innebär risk för dina rättigheter och friheter
              kommer vi att underrätta dig och Integritetsskyddsmyndigheten i enlighet med GDPR:s krav.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Ändringar av policyn</h2>
            <p>
              Vi kan komma att uppdatera denna policy. Vid väsentliga ändringar informerar vi
              registrerade användare via e-post minst 14 dagar innan ändringen träder i kraft.
              Aktuell version finns alltid tillgänglig på denna sida med angivet versionsdatum.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Kontakt</h2>
            <p>
              Frågor, rättighetsförfrågningar eller klagomål rörande vår personuppgiftsbehandling
              besvaras av oss via{' '}
              <a href="mailto:info@reklamsidan.se" className="text-primary-600 hover:underline">info@reklamsidan.se</a>{' '}
              eller per post till Jaspen AB, Hejaregatan 30, 352 46 Växjö.
              Vi svarar senast inom 30 dagar.
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
            <Link href="/villkor" className="hover:text-gray-700">Villkor</Link>
            <Link href="/integritet" className="hover:text-gray-700 font-medium text-gray-700">Integritetspolicy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
