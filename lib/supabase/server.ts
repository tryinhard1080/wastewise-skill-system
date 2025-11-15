/**
 * Supabase Server Client
 *
 * This client is used for server-side operations in Server Components,
 * Route Handlers, and Server Actions. It properly handles cookies for
 * authentication.
 *
 * @usage
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 *
 * // In a Server Component
 * export default async function MyPage() {
 *   const supabase = await createClient()
 *   const { data, error } = await supabase.from('projects').select('*')
 *   return <div>...</div>
 * }
 *
 * // In a Route Handler
 * export async function GET() {
 *   const supabase = await createClient()
 *   const { data, error } = await supabase.from('projects').select('*')
 *   return Response.json({ data })
 * }
 * ```
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Server-side service client with elevated permissions
 *
 * CRITICAL: Only use this for operations that require admin privileges.
 * This bypasses Row Level Security (RLS) policies.
 *
 * @usage
 * ```tsx
 * import { createServiceClient } from '@/lib/supabase/server'
 *
 * const supabase = createServiceClient()
 * // Bypass RLS for admin operations
 * const { data, error } = await supabase.from('projects').select('*')
 * ```
 */
export function createServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}
