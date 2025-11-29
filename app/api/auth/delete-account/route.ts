import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Tables to clean up when deleting user
const TABLES_TO_CLEAN = [
  'profiles',
  'projects',
  'analysis_jobs',
  'invoices',
  'contracts',
  'haul_logs',
  'reports',
  'uploaded_files',
]

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
      user_id: user.id,
    })

    if (error) {
      // If the RPC function doesn't exist, fallback to manual deletion
      console.warn('delete_user_cascade RPC not found, using manual deletion')
      
      for (const tableName of TABLES_TO_CLEAN) {
        try {
          await supabase.from(tableName).delete().eq('user_id', user.id)
        } catch (tableError) {
          console.warn(`Failed to delete from ${tableName}:`, tableError)
          // Continue with other tables even if one fails
        }
      }
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