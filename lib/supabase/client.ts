/**
 * Supabase Browser Client
 *
 * This client is used for client-side operations in the browser.
 * It automatically handles session management and refreshes tokens.
 *
 * @usage
 * ```tsx
 * import { createClient } from '@/lib/supabase/client'
 *
 * const supabase = createClient()
 * const { data, error } = await supabase.from('projects').select('*')
 * ```
 */

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
