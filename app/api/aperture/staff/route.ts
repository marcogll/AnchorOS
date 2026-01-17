import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * @description Gets available staff for a location and date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const date = searchParams.get('date')

    if (!locationId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: location_id, date' },
        { status: 400 }
      )
    }

    const { data: staff, error: staffError } = await supabaseAdmin.rpc('get_available_staff', {
      p_location_id: locationId,
      p_start_time_utc: `${date}T00:00:00Z`,
      p_end_time_utc: `${date}T23:59:59Z`
    })

    if (staffError) {
      return NextResponse.json(
        { error: staffError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      staff: staff || []
    })
  } catch (error) {
    console.error('Aperture staff GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
