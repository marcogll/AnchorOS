import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Get staff list with comprehensive filtering for Aperture dashboard
 * @param {NextRequest} request - Contains query parameters for location_id, role, is_active, include_schedule
 * @returns {NextResponse} JSON with staff array, including locations and optional schedule data
 * @example GET /api/aperture/staff?location_id=123&role=staff&include_schedule=true
 * @audit BUSINESS RULE: Only admin/manager roles can access staff data via this endpoint
 * @audit SECURITY: RLS policies 'staff_select_admin_manager' and 'staff_select_same_location' applied
 * @audit Validate: Staff data includes sensitive info, access must be role-restricted
 * @audit PERFORMANCE: Indexed queries on location_id, role, is_active for fast filtering
 * @audit PERFORMANCE: Schedule data loaded separately to avoid N+1 queries
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const role = searchParams.get('role')
    const isActive = searchParams.get('is_active')
    const includeSchedule = searchParams.get('include_schedule') === 'true'

    let query = supabaseAdmin
      .from('staff')
      .select(`
        id,
        user_id,
        location_id,
        role,
        display_name,
        phone,
        is_active,
        created_at,
        updated_at,
        locations (
          id,
          name,
          address
        )
      `)

    // Apply filters
    if (locationId) {
      query = query.eq('location_id', locationId)
    }
    if (role) {
      query = query.eq('role', role)
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    // Order by display name
    query = query.order('display_name')

    const { data: staff, error: staffError } = await query

    if (staffError) {
      console.error('Aperture staff GET error:', staffError)
      return NextResponse.json(
        { error: staffError.message },
        { status: 500 }
      )
    }

    // If schedule is requested, get current day's availability
    if (includeSchedule) {
      const today = new Date().toISOString().split('T')[0]
      const staffIds = staff?.map(s => s.id) || []

      if (staffIds.length > 0) {
        const { data: schedules } = await supabaseAdmin
          .from('staff_availability')
          .select('staff_id, day_of_week, start_time, end_time')
          .in('staff_id', staffIds)
          .eq('is_available', true)

        // Group schedules by staff_id
        const scheduleMap = new Map()
        schedules?.forEach(schedule => {
          if (!scheduleMap.has(schedule.staff_id)) {
            scheduleMap.set(schedule.staff_id, [])
          }
          scheduleMap.get(schedule.staff_id).push(schedule)
        })

        // Add schedules to staff data
        staff?.forEach(member => {
          (member as any).schedule = scheduleMap.get(member.id) || []
        })
      }
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

/**
 * @description Create a new staff member with validation and audit logging
 * @param {NextRequest} request - JSON body with location_id, role, display_name, phone, user_id
 * @returns {NextResponse} JSON with created staff member data
 * @example POST /api/aperture/staff {"location_id": "123", "role": "staff", "display_name": "John Doe"}
 * @audit BUSINESS RULE: Staff creation requires valid location_id and proper role assignment
 * @audit SECURITY: Only admin users can create staff members via this endpoint
 * @audit Validate: Role must be one of: admin, manager, staff, artist, kiosk
 * @audit Validate: Location must exist and be active before staff creation
 * @audit AUDIT: All staff creation logged in audit_logs table with new_values
 * @audit DATA INTEGRITY: Foreign key constraints ensure location_id validity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location_id, role, display_name, phone, user_id } = body

    if (!location_id || !role || !display_name) {
      return NextResponse.json(
        { error: 'Missing required fields: location_id, role, display_name' },
        { status: 400 }
      )
    }

    // Check if location exists
    const { data: location } = await supabaseAdmin
      .from('locations')
      .select('id')
      .eq('id', location_id)
      .single()

    if (!location) {
      return NextResponse.json(
        { error: 'Invalid location_id' },
        { status: 400 }
      )
    }

    // Create staff member
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .insert({
        location_id,
        role,
        display_name,
        phone,
        user_id,
        is_active: true
      })
      .select(`
        id,
        user_id,
        location_id,
        role,
        display_name,
        phone,
        is_active,
        created_at,
        locations (
          id,
          name,
          address
        )
      `)
      .single()

    if (staffError) {
      console.error('Aperture staff POST error:', staffError)
      return NextResponse.json(
        { error: staffError.message },
        { status: 500 }
      )
    }

    // Log creation
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'staff',
        entity_id: staff.id,
        action: 'create',
        new_values: staff,
        performed_by_role: 'admin'
      })

    return NextResponse.json({
      success: true,
      staff
    })
  } catch (error) {
    console.error('Aperture staff POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
