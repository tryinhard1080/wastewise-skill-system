import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Generate a random API key
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const segments = [8, 4, 4, 4, 12]
  
  return segments.map(length => 
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('_')
}

// Generate key preview (first 4 characters + stars)
function generateKeyPreview(key: string): string {
  const firstSegment = key.split('_')[0]
  return `${firstSegment}_****_****_****_****`
}

// Export functions for use in other routes
export { generateApiKey, generateKeyPreview }

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error('Get API keys error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { name, expires_in } = await request.json()
    
    const apiKey = generateApiKey()
    const expiresAt = expires_in === '0' ? null : new Date(
      Date.now() + (parseInt(expires_in) * 24 * 60 * 60 * 1000)
    )

    const { data: createdKey, error } = await supabase
      .from('api_keys')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        name,
        key: apiKey,
        key_preview: generateKeyPreview(apiKey),
        expires_at: expiresAt?.toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Create API key error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ apiKey: createdKey })
  } catch (error) {
    console.error('Create API key error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}