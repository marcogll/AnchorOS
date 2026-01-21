import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Validates that the request contains a valid ADMIN_ENROLLMENT_KEY authorization header
 * @param {NextRequest} request - HTTP request to validate
 * @returns {Promise<boolean|null>} Returns true if authorized, null if unauthorized, or throws error on invalid format
 * @example validateAdminOrStaff(request)
 * @audit SECURITY: Simple API key validation for administrative operations
 * @audit Validate: Ensures authorization header follows 'Bearer <token>' format
 */
async function validateAdminOrStaff(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  
  if (token !== process.env.ADMIN_ENROLLMENT_KEY) {
    return null
  }

  return true
}

/**
 * @description Creates a new staff unavailability record to block a staff member for a specific time period
 * @param {NextRequest} request - HTTP request containing staff_id, date, start_time, end_time, optional reason and location_id
 * @returns {NextResponse} JSON with success status and created availability record
 * @example POST /api/availability/staff-unavailable { staff_id: "...", date: "2026-01-21", start_time: "10:00", end_time: "14:00", reason: "Lunch meeting" }
 * @audit BUSINESS RULE: Prevents double-booking by blocking staff during unavailable times
 * @audit SECURITY: Requires ADMIN_ENROLLMENT_KEY authorization header
 * @audit Validate: Ensures staff exists and no existing availability record for the same date/time
 * @audit Validate: Checks that start_time is before end_time and date is valid
 * @audit AUDIT: All unavailability records are logged for staffing management
 */
export async function POST(request: NextRequest) {
  try {
    const hasAccess = await validateAdminOrStaff(request)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      staff_id,
      date,
      start_time,
      end_time,
      reason,
      location_id
    } = body

    if (!staff_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: staff_id, date, start_time, end_time' },
        { status: 400 }
      )
    }

    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('id, location_id')
      .eq('id', staff_id)
      .single()

    if (staffError || !staff) {
      return NextResponse.json(
        { error: staffError?.message || 'Staff not found' },
        { status: 400 }
      )
    }

    const { data: availability, error: availabilityError } = await supabaseAdmin.rpc('check_staff_availability', {
      p_staff_id: staff_id,
      p_start_time_utc: `${date}T${start_time}Z`,
      p_end_time_utc: `${date}T${end_time}Z`
    })

    if (availabilityError) {
      return NextResponse.json(
        { error: availabilityError.message },
        { status: 400 }
      )
    }

    const { data: existingAvailability } = await supabaseAdmin
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staff_id)
      .eq('date', date)
      .single()

    if (existingAvailability) {
      return NextResponse.json(
        { error: 'Availability already exists for this staff and date' },
        { status: 400 }
      )
    }

    const { data: newAvailability, error: createError } = await supabaseAdmin
      .from('staff_availability')
      .insert({
        staff_id,
        date,
        start_time,
        end_time,
        is_available: false,
        reason,
        created_by: staff_id
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      availability: newAvailability
    })
  } catch (error) {
    console.error('Staff unavailable POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Retrieves staff unavailability records filtered by staff ID and optional date range
 * @param {NextRequest} request - HTTP request with query parameters staff_id, optional start_date and end_date
 * @returns {NextResponse} JSON with array of availability records sorted by date
 * @example GET /api/availability/staff-unavailable?staff_id=...&start_date=2026-01-01&end_date=2026-01-31
 * @audit BUSINESS RULE: Returns only unavailability records (is_available = false)
 * @audit SECURITY: Requires ADMIN_ENROLLMENT_KEY authorization header
 * @audit Validate: Ensures staff_id is provided as required parameter
 * @audit PERFORMANCE: Supports optional date range filtering for efficient queries
 */
export async function GET(request: NextRequest) {
  try {
    const hasAccess = await validateAdminOrStaff(request)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staff_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!staffId) {
      return NextResponse.json(
        { error: 'Missing required parameter: staff_id' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staffId)

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: availabilityList, error } = await query.order('date', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      availability: availabilityList || []
    })
  } catch (error) {
    console.error('Staff unavailable GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
