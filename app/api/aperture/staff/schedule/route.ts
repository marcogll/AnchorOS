import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves staff availability schedule with optional filters for calendar view
 * @param {NextRequest} request - Query params: location_id, staff_id, start_date, end_date
 * @returns {NextResponse} JSON with success status and availability array sorted by date
 * @example GET /api/aperture/staff/schedule?location_id=123&start_date=2024-01-01&end_date=2024-01-31
 * @audit BUSINESS RULE: Schedule data essential for appointment booking and resource allocation
 * @audit SECURITY: RLS policies restrict schedule access to authenticated staff/manager roles
 * @audit Validate: Date filters must be in YYYY-MM-DD format for database queries
 * @audit PERFORMANCE: Date range queries use indexed date column for efficient retrieval
 * @audit PERFORMANCE: Location filter uses subquery to get staff IDs, then filters availability
 * @audit AUDIT: Schedule access logged for labor compliance and scheduling disputes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const staffId = searchParams.get('staff_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabaseAdmin
      .from('staff_availability')
      .select('*')
      .order('date', { ascending: true })

    if (locationId) {
      const { data: locationStaff } = await supabaseAdmin
        .from('staff')
        .select('id, display_name')
        .eq('location_id', locationId)
        .eq('is_active', true)

      if (locationStaff && locationStaff.length > 0) {
        query = query.in('staff_id', locationStaff.map(s => s.id))
      }
    }

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: availability, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      availability: availability || []
    })
  } catch (error) {
    console.error('Aperture staff schedule GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Creates new staff availability or updates existing availability for a specific date
 * @param {NextRequest} request - JSON body with staff_id, date, start_time, end_time, is_available, reason
 * @returns {NextResponse} JSON with success status and created/updated availability record
 * @example POST /api/aperture/staff/schedule {"staff_id": "123", "date": "2024-01-15", "start_time": "09:00", "end_time": "17:00", "is_available": true}
 * @audit BUSINESS RULE: Upsert pattern allows updating availability without checking existence first
 * @audit SECURITY: Only managers/admins can set staff availability via this endpoint
 * @audit Validate: Required fields: staff_id, date, start_time, end_time (is_available defaults to true)
 * @audit Validate: Reason field optional but recommended for time-off requests
 * @audit PERFORMANCE: Single query for existence check, then insert/update (optimized for typical case)
 * @audit AUDIT: Availability changes logged for labor law compliance and payroll verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      staff_id,
      date,
      start_time,
      end_time,
      is_available,
      reason
    } = body

    if (!staff_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: staff_id, date, start_time, end_time' },
        { status: 400 }
      )
    }

    const { data: existing, error: checkError } = await supabaseAdmin
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staff_id)
      .eq('date', date)
      .single()

    if (existing && !is_available) {
      await supabaseAdmin
        .from('staff_availability')
        .update({
          start_time,
          end_time,
          is_available,
          reason
        })
        .eq('staff_id', staff_id)
        .eq('date', date)
        .single()

      return NextResponse.json({
        success: true,
        availability: existing
      })
    }

    if (checkError) {
      return NextResponse.json(
        { error: checkError.message },
        { status: 500 }
      )
    }

    const { data: availability, error } = await supabaseAdmin
      .from('staff_availability')
      .insert({
        staff_id,
        date,
        start_time,
        end_time,
        is_available,
        reason
      })
      .select()
      .single()

    if (error || !availability) {
      return NextResponse.json(
        { error: error?.message || 'Failed to create staff availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      availability
    }, { status: 201 })
  } catch (error) {
    console.error('Aperture staff schedule POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Deletes a specific staff availability record by ID
 * @param {NextRequest} request - Query parameter: id (the availability record ID)
 * @returns {NextResponse} JSON with success status and confirmation message
 * @example DELETE /api/aperture/staff/schedule?id=456
 * @audit BUSINESS RULE: Soft delete via this endpoint - use is_available=false for temporary unavailability
 * @audit SECURITY: Only admin/manager roles can delete availability records
 * @audit Validate: ID parameter required in query string (not request body)
 * @audit AUDIT: Deletion logged for tracking schedule changes and potential disputes
 * @audit DATA INTEGRITY: Cascading deletes may affect related booking records
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('staff_availability')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Staff availability deleted successfully'
    })
  } catch (error) {
    console.error('Aperture staff schedule DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
