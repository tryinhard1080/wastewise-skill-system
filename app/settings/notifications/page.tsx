'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const notificationSettings = [
  {
    id: 'email_notifications',
    title: 'Email Notifications',
    description: 'Receive important updates about your account and projects via email',
  },
  {
    id: 'analysis_complete',
    title: 'Analysis Complete',
    description: 'Get notified when your analysis is finished and reports are ready',
    },
  {
    id: 'weekly_digest',
    title: 'Weekly Digest',
    description: 'Weekly summary of your activities and insights',
  },
  {
    id: 'new_features',
    title: 'New Features',
    description: 'Learn about new features and improvements to WasteWise',
  },
]

export default function NotificationsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    email_notifications: true,
    analysis_complete: true,
    weekly_digest: false,
    new_features: true,
  })

  async function handleToggle(key: string, value: boolean) {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      toast.success('Settings updated')
    } catch {
      toast.error('Failed to update settings')
      // Revert on error
      setSettings(prev => ({
        ...prev,
        [key]: !value
      }))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose which notifications you&apos;d like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationSettings.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between space-y-0"
            >
              <div className="space-y-1">
                <Label htmlFor={item.id} className="text-base font-medium">
                  {item.title}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Switch
                id={item.id}
                checked={settings[item.id]}
                onCheckedChange={(value) => handleToggle(item.id, value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Delivery</CardTitle>
          <CardDescription>
            Your current email address for notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-medium">Email:</span>
            <span className="text-muted-foreground">user@example.com</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            To change your email address, please contact support
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
