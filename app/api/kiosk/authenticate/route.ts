import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { Kiosk } from '@/lib/db/types'

export async function POST(request: NextRequest) {
  try {
    const { api_key } = await request.json()

    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    const { data: kiosk, error } = await supabase
      .from('kiosks')
      .select(`
        id,
        location_id,
        device_name,
        display_name,
        is_active,
        location (
          id,
          name,
          timezone
        )
      `)
      .eq('api_key', api_key)
      .eq('is_active', true)
      .single()

    if (error || !kiosk) {
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
        location: kiosk.location
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
