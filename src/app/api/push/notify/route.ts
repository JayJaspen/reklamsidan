import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification, type PushSubscription } from '@/lib/webpush'

// POST /api/push/notify
// Anropas efter att en annons publicerats.
// Skickar push-notiser till:
//   1. Följare av företaget (favoritreklam)
//   2. Användare med matchande kategoriintressen (intressereklam)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Autentisera – måste vara inloggat företag
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

    const { adId } = await req.json()
    if (!adId) return NextResponse.json({ error: 'adId saknas' }, { status: 400 })

    // Hämta annonsdetaljer
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('id, name, ad_type, company_id')
      .eq('id', adId)
      .eq('company_id', user.id) // Säkerhet: bara egna annonser
      .single()

    if (adError || !ad) {
      return NextResponse.json({ error: 'Annons hittades inte' }, { status: 404 })
    }

    // Hämta företagsnamn
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', user.id)
      .single()

    const companyName = company?.name ?? 'Okänt företag'

    // ── Samla mottagare ──────────────────────────────────────

    const recipientSet = new Set<string>()

    // 1. Följare av företaget (visas under "Favoritreklam")
    const { data: followers } = await supabase
      .from('user_favorites')
      .select('user_id')
      .eq('company_id', user.id)

    ;(followers ?? []).forEach(f => recipientSet.add(f.user_id))

    // 2. Användare med kategoriintresse (visas under "Intressereklam")
    const catTable = ad.ad_type === 'b2c'
      ? 'ad_target_categories_b2c'
      : 'ad_target_categories_b2b'
    const userCatTable = ad.ad_type === 'b2c'
      ? 'users_b2c_categories'
      : 'users_b2b_categories'

    const { data: adCats } = await supabase
      .from(catTable)
      .select('category_id')
      .eq('ad_id', adId)

    const catIds = (adCats ?? []).map(c => c.category_id)

    if (catIds.length > 0) {
      const { data: intressedUsers } = await supabase
        .from(userCatTable)
        .select('user_id')
        .in('category_id', catIds)

      ;(intressedUsers ?? []).forEach(u => recipientSet.add(u.user_id))
    }

    if (recipientSet.size === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    const recipientIds = [...recipientSet]

    // ── Hämta push-prenumerationer ───────────────────────────
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', recipientIds)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    // ── Skicka notiser ───────────────────────────────────────
    const notifUrl = ad.ad_type === 'b2c' ? '/b2c/favoritreklam' : '/b2b/favoritreklam'

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        sendPushNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          {
            title: `Ny reklam från ${companyName}`,
            body: ad.name,
            url: notifUrl,
          }
        )
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    if (failed > 0) {
      console.warn(`Push: ${sent} lyckades, ${failed} misslyckades`)
    }

    return NextResponse.json({ ok: true, sent, failed })
  } catch (err) {
    console.error('Push notify error:', err)
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 })
  }
}
