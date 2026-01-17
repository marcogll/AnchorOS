import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * @description Fetches bookings with filters for dashboard view
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const staffId = searchParams.get('staff_id')
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        short_id,
        status,
        start_time_utc,
        end_time_utc,
        is_paid,
        created_at,
        customer (
          id,
          first_name,
          last_name,
          email
        ),
        service (
          id,
          name,
          duration_minutes,
          base_price
        ),
        staff (
          id,
          display_name
        ),
        resource (
          id,
          name,
          type
        )
      `)
      .order('start_time_utc', { ascending: true })

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (startDate) {
      query = query.gte('start_time_utc', startDate)
    }

    if (endDate) {
      query = query.lte('end_time_utc', endDate)
    }

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    if (status) {
      query = query.in('status', status.split(','))
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('Aperture dashboard GET error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      bookings: bookings || []
    })
  } catch (error) {
    console.error('Aperture dashboard GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
