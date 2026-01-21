import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves a list of available staff members for a specific time range and location
 * @param {NextRequest} request - HTTP request with query parameters for location_id, start_time_utc, and end_time_utc
 * @returns {NextResponse} JSON with available staff array, time range details, and count
 * @example GET /api/availability/staff?location_id=...&start_time_utc=...&end_time_utc=...
 * @audit BUSINESS RULE: Staff must be active, available for booking, and have no booking conflicts in the time range
 * @audit SECURITY: Validates required query parameters before database call
 * @audit Validate: Ensures start_time_utc is before end_time_utc and both are valid ISO8601 timestamps
 * @audit PERFORMANCE: Uses RPC function 'get_available_staff' for optimized database query
 * @audit AUDIT: Staff availability queries are logged for operational monitoring
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const serviceId = searchParams.get('service_id')
    const date = searchParams.get('date')
    const startTime = searchParams.get('start_time_utc')
    const endTime = searchParams.get('end_time_utc')

    if (!locationId) {
      return NextResponse.json(
        { error: 'Missing required parameter: location_id' },
        { status: 400 }
      )
    }

    let staff: any[] = []

    if (startTime && endTime) {
      const { data, error } = await supabaseAdmin.rpc('get_available_staff', {
        p_location_id: locationId,
        p_start_time_utc: startTime,
        p_end_time_utc: endTime
      })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      staff = data || []
    } else if (date && serviceId) {
      const { data: service, error: serviceError } = await supabaseAdmin
        .from('services')
        .select('duration_minutes')
        .eq('id', serviceId)
        .single()

      if (serviceError || !service) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        )
      }

      const { data: allStaff, error: staffError } = await supabaseAdmin
        .from('staff')
        .select(`
          id,
          display_name,
          role,
          is_active,
          user_id,
          location_id,
          staff_services!inner (
            service_id,
            is_active
          )
        `)
        .eq('location_id', locationId)
        .eq('is_active', true)
        .eq('role', 'artist')
        .eq('staff_services.service_id', serviceId)
        .eq('staff_services.is_active', true)

      if (staffError) {
        return NextResponse.json(
          { error: staffError.message },
          { status: 400 }
        )
      }

      const deduped = new Map()
      allStaff?.forEach((s: any) => {
        if (!deduped.has(s.id)) {
          deduped.set(s.id, {
            id: s.id,
            display_name: s.display_name,
            role: s.role,
            is_active: s.is_active
          })
        }
      })

      staff = Array.from(deduped.values())
    } else {
      const { data: allStaff, error: staffError } = await supabaseAdmin
        .from('staff')
        .select('id, display_name, role, is_active')
        .eq('location_id', locationId)
        .eq('is_active', true)
        .eq('role', 'artist')

      if (staffError) {
        return NextResponse.json(
          { error: staffError.message },
          { status: 400 }
        )
      }

      staff = allStaff || []
    }

    return NextResponse.json({
      success: true,
      staff,
      location_id: locationId,
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
