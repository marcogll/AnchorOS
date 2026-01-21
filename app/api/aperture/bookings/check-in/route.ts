import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Records a customer check-in for an existing booking, marking the service as started
 * @param {NextRequest} request - HTTP request containing booking_id and staff_id (the staff member performing check-in)
 * @returns {NextResponse} JSON with success status and updated booking data including check-in timestamp
 * @example POST /api/aperture/bookings/check-in { booking_id: "...", staff_id: "..." }
 * @audit BUSINESS RULE: Records check-in time for no-show calculation and service tracking
 * @audit SECURITY: Validates that the staff member belongs to the same location as the booking
 * @audit Validate: Ensures booking exists and is not already checked in
 * @audit Validate: Ensures booking status is confirmed or pending
 * @audit PERFORMANCE: Uses RPC function 'record_booking_checkin' for atomic operation
 * @audit AUDIT: Check-in events are logged for service tracking and no-show analysis
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
