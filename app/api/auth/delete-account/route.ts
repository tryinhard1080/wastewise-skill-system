import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use a transaction to safely delete all user data
    const { error } = await supabase.rpc('delete_user_cascade', {
      user_id_param: user.id,
    })

    if (error) {
      // If the RPC function doesn't exist, fallback to manual deletion
      console.warn('delete_user_cascade RPC not found, using manual deletion:', error.message)

      // Delete from known tables in order (respecting foreign keys)
      await supabase.from('api_keys').delete().eq('user_id', user.id)
      await supabase.from('analysis_jobs').delete().eq('user_id', user.id)
      await supabase.from('projects').delete().eq('user_id', user.id)
      await supabase.from('profiles').delete().eq('user_id', user.id)
    }

    // Delete the user from auth.users
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
      user.id
    )

    if (deleteUserError && deleteUserError.message !== 'User not found') {
      console.error('Error deleting auth user:', deleteUserError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}