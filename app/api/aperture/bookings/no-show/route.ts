import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Apply no-show penalty to a specific booking
 * @param {NextRequest} request - Body with booking_id and optional override_by (admin)
 * @returns {NextResponse} Penalty application result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { booking_id, override_by } = body

    if (!booking_id) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Apply penalty
    const { error } = await supabaseAdmin.rpc('apply_no_show_penalty', {
      p_booking_id: booking_id,
      p_override_by: override_by || null
    })

    if (error) {
      console.error('Error applying no-show penalty:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Get updated booking details
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    return NextResponse.json({
      success: true,
      data: booking
    })
  } catch (error) {
    console.error('Error in POST /api/aperture/bookings/no-show:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
