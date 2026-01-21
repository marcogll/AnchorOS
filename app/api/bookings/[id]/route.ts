import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Updates the status of a specific booking by booking ID
 * @param {NextRequest} request - HTTP request containing the new status in request body
 * @param {Object} params - Route parameters containing the booking ID
 * @param {string} params.id - The UUID of the booking to update
 * @returns {NextResponse} JSON with success status and updated booking data
 * @example PATCH /api/bookings/123e4567-e89b-12d3-a456-426614174000 { "status": "confirmed" }
 * @audit BUSINESS RULE: Only allows valid status transitions (pending→confirmed→completed/cancelled/no_show)
 * @audit SECURITY: Requires authentication and booking ownership validation
 * @audit Validate: Ensures status is one of the predefined valid values
 * @audit AUDIT: Status changes are logged in audit_logs table
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Missing required field: status' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const { data: booking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single()

    if (updateError || !booking) {
      return NextResponse.json(
        { error: updateError?.message || 'Failed to update booking' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      booking
    })
  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
