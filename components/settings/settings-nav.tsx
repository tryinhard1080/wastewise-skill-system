'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User, Lock, Bell, Key } from 'lucide-react'

const navItems = [
  {
    title: 'Profile',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'Security',
    href: '/settings/security',
    icon: Lock,
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    title: 'API Keys',
    href: '/settings/api-keys',
    icon: Key,
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
