import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Proxy-route för PDF-filer från Supabase storage.
 *
 * Löser två problem på en gång:
 * 1. CORS – PDF.js gör fetch() i webbläsaren mot Supabase (cross-origin) vilket
 *    kan blockeras. Proxyn gör anropet server-side istället.
 * 2. Privat bucket – om "ads"-bucketen inte är publik fungerar inte getPublicUrl().
 *    Service role-nyckeln ger åtkomst oavsett bucket-inställning.
 *
 * Säkerhet: Endast URL:er från det konfigurerade Supabase-projektet tillåts,
 * och enbart filer i storage/v1/object/public/-sökvägen.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileUrl = searchParams.get('url')

  if (!fileUrl) {
    return new NextResponse('Saknar url-parameter', { status: 400 })
  }

  // Validera att det är en giltig URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(fileUrl)
  } catch {
    return new NextResponse('Ogiltig URL', { status: 400 })
  }

  // Säkerhetscheck: tillåt bara URL:er från det konfigurerade Supabase-projektet
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('PDF proxy: miljövariabler saknas')
    return new NextResponse('Serverkonfiguration saknas', { status: 500 })
  }

  const allowedHostname = new URL(supabaseUrl).hostname
  if (parsedUrl.hostname !== allowedHostname) {
    return new NextResponse('Förbjuden URL', { status: 403 })
  }

  // Extrahera bucket och sökväg från URL:en
  // Format: /storage/v1/object/public/<bucket>/<path>
  const pathMatch = parsedUrl.pathname.match(
    /^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
  )
  if (!pathMatch) {
    return new NextResponse('Ogiltig lagringsväg', { status: 400 })
  }
  const [, bucket, filePath] = pathMatch

  try {
    // Använd service role för att ladda ner filen – fungerar oavsett om
    // bucketen är publik eller privat
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data, error } = await supabase.storage.from(bucket).download(filePath)

    if (error || !data) {
      console.error('PDF proxy – nedladdning misslyckades:', error?.message)
      return new NextResponse('PDF:en hittades inte', { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    // Cacha i webbläsaren i 1 timme
    headers.set('Cache-Control', 'private, max-age=3600')

    return new NextResponse(data, { status: 200, headers })
  } catch (err) {
    console.error('PDF proxy – oväntat fel:', err)
    return new NextResponse('Internt serverfel', { status: 500 })
  }
}
