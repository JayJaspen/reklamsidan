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
        <p className="text-sm text-gray-400 mb-10">Senast uppdaterad: mars 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Personuppgiftsansvarig</h2>
            <p>
              Jaspen AB (org.nr. [FYLL I]), nedan kallat "vi" eller "Reklamsidan", är personuppgiftsansvarig
              för behandlingen av dina personuppgifter. Kontaktuppgifter:{' '}
              <a href="mailto:info@reklamsidan.se" className="text-primary-600 hover:underline">info@reklamsidan.se</a>,
              [ADRESS], [POSTNUMMER] [STAD].
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Vilka uppgifter samlar vi in?</h2>
            <p>Vi samlar in följande kategorier av personuppgifter:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Kontouppgifter:</strong> namn, e-postadress, lösenord (krypterat), användartyp</li>
              <li><strong>Profiluppgifter:</strong> ålder, kön, intressen, bostadsort/län (för privatpersoner och B2B)</li>
              <li><strong>Företagsuppgifter:</strong> företagsnamn, organisationsnummer, logotyp, faktureringsadress</li>
              <li><strong>Användningsdata:</strong> vilka annonser du sett och interagerat med, sparade annonser och favoriter</li>
              <li><strong>Tekniska uppgifter:</strong> push-notis-prenumerationer (anonymiserat enhets-ID)</li>
              <li><strong>Kommunikation:</strong> meddelanden skickade via kontaktformuläret</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Varför behandlar vi dina uppgifter?</h2>
            <p>Vi behandlar dina personuppgifter för följande ändamål och med följande rättsliga grunder:</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Tillhandahålla tjänsten</p>
                <p className="text-sm mt-1">Hantera konton, visa anpassad reklam, tillhandahålla jobb- och fastighetsannonser.</p>
                <p className="text-xs text-gray-400 mt-1">Rättslig grund: Avtal (art. 6.1 b GDPR)</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Fakturering</p>
                <p className="text-sm mt-1">Beräkna och skicka fakturor till annonsörer baserat på faktisk användning.</p>
                <p className="text-xs text-gray-400 mt-1">Rättslig grund: Avtal + rättslig förpliktelse (bokföringslagen)</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Push-notiser</p>
                <p className="text-sm mt-1">Skicka notiser om ny reklam och jobb från dina favoritföretag.</p>
                <p className="text-xs text-gray-400 mt-1">Rättslig grund: Samtycke (art. 6.1 a GDPR)</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="font-medium text-gray-800">Statistik och förbättring</p>
                <p className="text-sm mt-1">Aggregerad statistik för att förbättra tjänsten. Inga enskilda användare identifieras.</p>
                <p className="text-xs text-gray-400 mt-1">Rättslig grund: Berättigat intresse (art. 6.1 f GDPR)</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Hur länge sparar vi uppgifterna?</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kontouppgifter: så länge kontot är aktivt, därefter 12 månader</li>
              <li>Fakturaunderlag: 7 år (bokföringslagens krav)</li>
              <li>Användningsdata (annonsläsningar): 24 månader rullande</li>
              <li>Push-notis-prenumerationer: tills du återkallar samtycket</li>
              <li>Kontaktformulär-meddelanden: 12 månader</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Delas uppgifterna med tredje part?</h2>
            <p>Vi delar inte dina personuppgifter med tredje part för marknadsföringssyften. Vi använder följande underleverantörer:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Supabase Inc.</strong> – databas och autentisering (EU-region)</li>
              <li><strong>Vercel Inc.</strong> – hosting och CDN</li>
              <li><strong>Resend Inc.</strong> – transaktionell e-post (kontaktformulär)</li>
            </ul>
            <p className="mt-3">
              Alla underleverantörer har tecknat databehandlaravtal och behandlar data i enlighet med GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Dina rättigheter</h2>
            <p>Enligt GDPR har du rätt att:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Tillgång</strong> – begära ett registerutdrag över dina uppgifter</li>
              <li><strong>Rättelse</strong> – korrigera felaktiga uppgifter</li>
              <li><strong>Radering</strong> – begära att vi raderar dina uppgifter ("rätten att bli glömd")</li>
              <li><strong>Begränsning</strong> – begära att vi begränsar behandlingen</li>
              <li><strong>Dataportabilitet</strong> – få ut dina uppgifter i maskinläsbart format</li>
              <li><strong>Invändning</strong> – invända mot behandling baserad på berättigat intresse</li>
              <li><strong>Återkalla samtycke</strong> – när som helst återkalla samtycke till push-notiser</li>
            </ul>
            <p className="mt-3">
              Skicka din begäran till{' '}
              <a href="mailto:info@reklamsidan.se" className="text-primary-600 hover:underline">info@reklamsidan.se</a>.
              Vi svarar inom 30 dagar. Du har också rätt att lämna klagomål till{' '}
              <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                Integritetsskyddsmyndigheten (IMY)
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>
              Reklamsidan använder session-cookies för autentisering. Dessa är nödvändiga för att tjänsten
              ska fungera och kräver inget separat samtycke. Vi använder inga spårningscookies eller
              tredjepartscookies för annonsering.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Säkerhet</h2>
            <p>
              Vi skyddar dina uppgifter med kryptering (TLS/HTTPS), åtkomstkontroller och
              rollbaserad behörighet. Lösenord lagras aldrig i klartext. Vår databas är skyddad
              med Row Level Security (RLS) som säkerställer att användare endast kan komma åt
              sina egna uppgifter.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Ändringar</h2>
            <p>
              Vi kan komma att uppdatera denna integritetspolicy. Vid väsentliga ändringar informerar
              vi dig via e-post minst 14 dagar i förväg. Aktuell version finns alltid på denna sida.
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
