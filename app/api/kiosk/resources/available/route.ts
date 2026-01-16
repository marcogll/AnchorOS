import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

async function validateKiosk(request: NextRequest) {
  const apiKey = request.headers.get('x-kiosk-api-key')
  
  if (!apiKey) {
    return null
  }

  const { data: kiosk } = await supabase
    .from('kiosks')
    .select('id, location_id, is_active')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single()

  return kiosk
}

export async function GET(request: NextRequest) {
  try {
    const kiosk = await validateKiosk(request)
    
    if (!kiosk) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const start_time = searchParams.get('start_time')
    const end_time = searchParams.get('end_time')
    const service_id = searchParams.get('service_id')

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: 'start_time and end_time are required' },
        { status: 400 }
      )
    }

    const startTime = new Date(start_time)
    const endTime = new Date(end_time)

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    let resourceQuery = supabase
      .rpc('get_available_resources_with_priority', {
        p_location_id: kiosk.location_id,
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString()
      })

    const { data: resources, error } = await resourceQuery

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    let availableResources = resources || []

    if (service_id) {
      const { data: service } = await supabase
        .from('services')
        .select('requires_dual_artist')
        .eq('id', service_id)
        .single()

      if (service?.requires_dual_artist) {
        availableResources = availableResources.filter(r => r.resource_type === 'room')
      }
    }

    return NextResponse.json({
      location_id: kiosk.location_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      resources: availableResources,
      total_available: availableResources.length
    })
  } catch (error) {
    console.error('Kiosk resources available error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
