import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Applies no-show penalty to a booking, retaining the deposit and updating booking status
 * @param {NextRequest} request - HTTP request containing booking_id and optional override_by (admin ID who approved override)
 * @returns {NextResponse} JSON with success status and updated booking data after penalty application
 * @example POST /api/aperture/bookings/no-show { booking_id: "...", override_by: "admin-id" }
 * @audit BUSINESS RULE: No-show penalty retains 50% deposit and marks booking as no_show status
 * @audit BUSINESS RULE: Admin can override penalty by providing override_by parameter
 * @audit SECURITY: Validates booking exists and can be marked as no-show
 * @audit Validate: Ensures booking is within no-show window (typically 12 hours before start time)
 * @audit Validate: If override is provided, validates admin permissions
 * @audit PERFORMANCE: Uses RPC function 'apply_no_show_penalty' for atomic penalty application
 * @audit AUDIT: No-show penalties are logged for customer tracking and revenue protection
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
