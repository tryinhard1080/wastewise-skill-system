// Force dynamic rendering - this page redirects
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

export default function SettingsPage() {
  redirect('/settings/profile')
}
