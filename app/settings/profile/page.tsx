import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/settings/profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProfileData {
  id: string
  user_id: string
  full_name?: string | null
  company?: string | null
  avatar_url?: string | null
  notification_preferences?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user profile from profiles table
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const profile: ProfileData | null = data as ProfileData | null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            Your account information and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Email</span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">User ID</span>
            <span className="text-sm text-muted-foreground font-mono">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Created</span>
            <span className="text-sm text-muted-foreground">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
