import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { Kiosk } from '@/lib/db/types'

/**
 * @description Authenticates a kiosk using API key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Auth request body:', body)
    const { api_key } = body

    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    console.log('Querying kiosk with api_key:', api_key)
    const { data: kiosk, error } = await supabaseAdmin
      .from('kiosks')
      .select(`
        id,
        location_id,
        device_name,
        display_name,
        is_active,
        locations (
          id,
          name,
          timezone
        )
      `)
      .eq('api_key', api_key)
      .eq('is_active', true)
      .single()

    console.log('Kiosk query result:', { error, kiosk })

    if (error || !kiosk) {
      console.log('Authentication failed:', error || 'Kiosk not found')
      return NextResponse.json(
        { error: 'Invalid API key or kiosk not active' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      kiosk: {
        id: kiosk.id,
        location_id: kiosk.location_id,
        device_name: kiosk.device_name,
        display_name: kiosk.display_name,
        is_active: kiosk.is_active,
        location: kiosk.locations
      }
    })
  } catch (error) {
    console.error('Kiosk authentication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
