import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/serviceRole'

export const revalidate = 3600 // Cachas i 1 timme

export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.rpc('get_public_stats')
    if (error) throw error
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ companies: 0, b2c_users: 0, b2b_users: 0 }, { status: 500 })
  }
}
