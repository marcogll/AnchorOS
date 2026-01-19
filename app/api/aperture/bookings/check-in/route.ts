import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Record check-in for a booking
 * @param {NextRequest} request - Body with booking_id and staff_id
 * @returns {NextResponse} Check-in result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { booking_id, staff_id } = body

    if (!booking_id || !staff_id) {
      return NextResponse.json(
        { success: false, error: 'Booking ID and Staff ID are required' },
        { status: 400 }
      )
    }

    // Record check-in
    const { data: success, error } = await supabaseAdmin.rpc('record_booking_checkin', {
      p_booking_id: booking_id,
      p_staff_id: staff_id
    })

    if (error) {
      console.error('Error recording check-in:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Check-in already recorded or booking not found' },
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
    console.error('Error in POST /api/aperture/bookings/check-in:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
