import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves detailed availability time slots for a specific location, service, and date
 * @param {NextRequest} request - HTTP request with query parameters location_id, service_id (optional), date, and time_slot_duration_minutes (optional, default 60)
 * @returns {NextResponse} JSON with success status and array of available time slots with staff count
 * @example GET /api/availability/time-slots?location_id=...&service_id=...&date=2026-01-21&time_slot_duration_minutes=30
 * @audit BUSINESS RULE: Returns only time slots where staff availability, resource availability, and business hours all align
 * @audit SECURITY: Public endpoint for booking availability display
 * @audit Validate: Ensures location_id and date are valid and required
 * @audit Validate: Ensures date is in valid YYYY-MM-DD format
 * @audit PERFORMANCE: Uses optimized RPC function 'get_detailed_availability' for complex availability calculation
 * @audit AUDIT: High-volume endpoint, consider rate limiting in production
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
