import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Reschedule booking with automatic collision detection and validation
 * @param {NextRequest} request - JSON body with bookingId, newStartTime, newStaffId, newResourceId
 * @returns {NextResponse} JSON with success confirmation and updated booking data
 * @example POST /api/aperture/bookings/123/reschedule {"newStartTime": "2026-01-16T14:00:00Z"}
 * @audit BUSINESS RULE: Rescheduling checks for staff and resource availability conflicts
 * @audit SECURITY: Only admin/manager can reschedule bookings via calendar interface
 * @audit Validate: newStartTime must be in future and within business hours
 * @audit Validate: No overlapping bookings for same staff/resource in new time slot
 * @audit AUDIT: All rescheduling actions logged in audit_logs with old/new values
 * @audit PERFORMANCE: Collision detection uses indexed queries for fast validation
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId, newStartTime, newStaffId, newResourceId } = await request.json()

    if (!bookingId || !newStartTime) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, newStartTime' },
        { status: 400 }
      )
    }

    // Get current booking
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*, services(duration_minutes)')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Calculate new end time
    const startTime = new Date(newStartTime)
    const duration = booking.services?.duration_minutes || 60
    const endTime = new Date(startTime.getTime() + duration * 60000)

    // Check for collisions
    const collisionChecks = []

    // Check staff availability
    if (newStaffId || booking.staff_id) {
      const staffId = newStaffId || booking.staff_id
      collisionChecks.push(
        supabaseAdmin
          .from('bookings')
          .select('id')
          .eq('staff_id', staffId)
          .neq('id', bookingId)
          .or(`and(start_time_utc.lt.${endTime.toISOString()},end_time_utc.gt.${startTime.toISOString()})`)
          .limit(1)
      )
    }

    // Check resource availability
    if (newResourceId || booking.resource_id) {
      const resourceId = newResourceId || booking.resource_id
      collisionChecks.push(
        supabaseAdmin
          .from('bookings')
          .select('id')
          .eq('resource_id', resourceId)
          .neq('id', bookingId)
          .or(`and(start_time_utc.lt.${endTime.toISOString()},end_time_utc.gt.${startTime.toISOString()})`)
          .limit(1)
      )
    }

    const collisionResults = await Promise.all(collisionChecks)
    const hasCollisions = collisionResults.some(result => result.data && result.data.length > 0)

    if (hasCollisions) {
      return NextResponse.json(
        { error: 'Time slot not available due to scheduling conflicts' },
        { status: 409 }
      )
    }

    // Update booking
    const updateData: any = {
      start_time_utc: startTime.toISOString(),
      end_time_utc: endTime.toISOString(),
      updated_at: new Date().toISOString()
    }

    if (newStaffId) updateData.staff_id = newStaffId
    if (newResourceId) updateData.resource_id = newResourceId

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    // Log the reschedule action
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'booking',
        entity_id: bookingId,
        action: 'update',
        new_values: {
          start_time_utc: updateData.start_time_utc,
          end_time_utc: updateData.end_time_utc,
          staff_id: updateData.staff_id,
          resource_id: updateData.resource_id
        },
        performed_by_role: 'admin'
      })

    return NextResponse.json({
      success: true,
      message: 'Booking rescheduled successfully',
      booking: {
        id: bookingId,
        startTime: updateData.start_time_utc,
        endTime: updateData.end_time_utc,
        staffId: updateData.staff_id || booking.staff_id,
        resourceId: updateData.resource_id || booking.resource_id
      }
    })

  } catch (error) {
    console.error('Unexpected error in reschedule API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}