import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

// Escape HTML-tecken för att förhindra injektion i e-postmallen
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Alla fält är obligatoriska.' }, { status: 400 })
    }

    // Längdbegränsning – skyddar mot enorma payloads
    if (name.length > 100 || email.length > 200 || message.length > 5000) {
      return NextResponse.json({ error: 'Ett eller flera fält är för långa.' }, { status: 400 })
    }

    // Enkel e-postvalidering
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Ogiltig e-postadress.' }, { status: 400 })
    }

    // Rate limiting: max 3 meddelanden per e-postadress per timme
    const supabase = await createClient()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', oneHourAgo)

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'För många meddelanden. Försök igen om en stund.' },
        { status: 429 }
      )
    }

    // Spara till Supabase
    await supabase.from('contact_messages').insert({ name, email, message })

    // Escape innan injektion i HTML-mall
    const safeName    = escapeHtml(name)
    const safeEmail   = escapeHtml(email)
    const safeMessage = escapeHtml(message)

    // Skicka e-post via Resend
    const { error } = await resend.emails.send({
      from: 'Reklamsidan <noreply@reklamsidan.se>',
      to: 'info@reklamsidan.se',
      replyTo: email,
      subject: `Nytt meddelande från ${safeName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1e40af">Nytt kontaktmeddelande</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-weight:600;width:100px">Namn:</td>
              <td style="padding:8px 0">${safeName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-weight:600">E-post:</td>
              <td style="padding:8px 0"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
            </tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px;border-left:4px solid #1e40af">
            <p style="margin:0;white-space:pre-wrap">${safeMessage}</p>
          </div>
          <p style="margin-top:24px;color:#9ca3af;font-size:12px">
            Skickat via kontaktformuläret på reklamsidan.se
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      // Meddelandet är sparat i Supabase även om e-posten misslyckas
      return NextResponse.json({ ok: true, emailSent: false })
    }

    return NextResponse.json({ ok: true, emailSent: true })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Serverfel, försök igen.' }, { status: 500 })
  }
}
