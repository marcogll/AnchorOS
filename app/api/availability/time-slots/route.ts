import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * @description Retrieves detailed availability time slots for a date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const serviceId = searchParams.get('service_id')
    const date = searchParams.get('date')

    if (!locationId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: location_id, date' },
        { status: 400 }
      )
    }

    const timeSlotDuration = parseInt(searchParams.get('time_slot_duration_minutes') || '60', 10);

    const { data: availability, error } = await supabaseAdmin.rpc('get_detailed_availability', {
      p_location_id: locationId,
      p_service_id: serviceId,
      p_date: date,
      p_time_slot_duration_minutes: timeSlotDuration
    })

    if (error) {
      console.error('RPC error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      availability
    })
  } catch (error) {
    console.error('Time slots GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
