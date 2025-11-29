import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateApiKey, generateKeyPreview } from '../../route'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate new API key
    const newApiKey = generateApiKey()
    
    // Update the key while preserving other properties
    const { data: updatedKey, error } = await supabase
      .from('api_keys')
      .update({
        key: newApiKey,
        key_preview: generateKeyPreview(newApiKey),
        updated_at: new Date().toISOString(),
        last_used_at: null, // Reset usage after regeneration
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Regenerate API key error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      apiKey: updatedKey 
    })
  } catch (error) {
    console.error('Regenerate API key error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}