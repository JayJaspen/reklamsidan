import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/push/subscribe – spara en push-prenumeration
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

    const { endpoint, p256dh, auth } = await req.json()
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Saknade fält' }, { status: 400 })
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      { user_id: user.id, endpoint, p256dh, auth },
      { onConflict: 'user_id,endpoint', ignoreDuplicates: true }
    )

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Push subscribe error:', err)
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 })
  }
}

// DELETE /api/push/subscribe – ta bort en push-prenumeration
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

    const { endpoint } = await req.json()
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint saknas' }, { status: 400 })
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Push unsubscribe error:', err)
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 })
  }
}
