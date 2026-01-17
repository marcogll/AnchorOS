import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * @description Retrieves available staff for a time range
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const startTime = searchParams.get('start_time_utc')
    const endTime = searchParams.get('end_time_utc')

    if (!locationId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required parameters: location_id, start_time_utc, end_time_utc' },
        { status: 400 }
      )
    }

    const { data: staff, error: staffError } = await supabaseAdmin.rpc('get_available_staff', {
      p_location_id: locationId,
      p_start_time_utc: startTime,
      p_end_time_utc: endTime
    })

    if (staffError) {
      return NextResponse.json(
        { error: staffError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      staff: staff || [],
      location_id: locationId,
      start_time_utc: startTime,
      end_time_utc: endTime,
      available_count: staff?.length || 0
    })
  } catch (error) {
    console.error('Available staff GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
