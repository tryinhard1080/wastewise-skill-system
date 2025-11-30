import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering - this route uses cookies for auth
export const dynamic = 'force-dynamic'

export async function PUT(request: Request) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const settings = await request.json()
    
    // Store notification preferences in user preferences/profiles table
    // For now, we'll add it as a JSON column to profiles table
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        user_id: user.id,
        notification_preferences: settings,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Notification settings error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      notification_preferences: profile?.notification_preferences || {},
    })
  } catch (error) {
    console.error('Get notification settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}