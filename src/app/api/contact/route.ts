import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Alla fält är obligatoriska.' }, { status: 400 })
    }

    // Spara till Supabase som backup
    const supabase = await createClient()
    await supabase.from('contact_messages').insert({ name, email, message })

    // Skicka e-post via Resend
    const { error } = await resend.emails.send({
      from: 'Reklamsidan <noreply@reklamsidan.se>',
      to: 'info@reklamsidan.se',
      replyTo: email,
      subject: `Nytt meddelande från ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1e40af">Nytt kontaktmeddelande</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-weight:600;width:100px">Namn:</td>
              <td style="padding:8px 0">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-weight:600">E-post:</td>
              <td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td>
            </tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px;border-left:4px solid #1e40af">
            <p style="margin:0;white-space:pre-wrap">${message}</p>
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
