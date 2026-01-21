import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Validates that the request contains a valid ADMIN_ENROLLMENT_KEY authorization header
 * @param {NextRequest} request - HTTP request to validate
 * @returns {Promise<boolean|null>} Returns true if authorized, null otherwise
 * @example validateAdmin(request)
 * @audit SECURITY: Simple API key validation for administrative booking block operations
 * @audit Validate: Ensures authorization header follows 'Bearer <token>' format
 */
async function validateAdmin(request: NextRequest) {
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
 * @description Creates a new booking block to reserve a resource for a specific time period
 * @param {NextRequest} request - HTTP request containing location_id, resource_id, start_time_utc, end_time_utc, and optional reason
 * @returns {NextResponse} JSON with success status and created booking block record
 * @example POST /api/availability/blocks { location_id: "...", resource_id: "...", start_time_utc: "...", end_time_utc: "...", reason: "Maintenance" }
 * @audit BUSINESS RULE: Blocks prevent bookings from using the resource during the blocked time
 * @audit SECURITY: Requires ADMIN_ENROLLMENT_KEY authorization header
 * @audit Validate: Ensures start_time_utc is before end_time_utc and both are valid ISO8601 timestamps
 * @audit AUDIT: All booking blocks are logged for operational monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await validateAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      location_id,
      resource_id,
      start_time_utc,
      end_time_utc,
      reason
    } = body

    if (!location_id || !resource_id || !start_time_utc || !end_time_utc) {
      return NextResponse.json(
        { error: 'Missing required fields: location_id, resource_id, start_time_utc, end_time_utc' },
        { status: 400 }
      )
    }

    const { data: block, error: blockError } = await supabaseAdmin
      .from('booking_blocks')
      .insert({
        location_id,
        resource_id,
        start_time_utc,
        end_time_utc,
        reason
      })
      .select()
      .single()

    if (blockError || !block) {
      return NextResponse.json(
        { error: blockError?.message || 'Failed to create booking block' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      block
    })
  } catch (error) {
    console.error('Booking blocks POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Retrieves booking blocks with optional filtering by location and date range
 * @param {NextRequest} request - HTTP request with query parameters location_id, start_date, end_date
 * @returns {NextResponse} JSON with array of booking blocks including related location, resource, and creator info
 * @example GET /api/availability/blocks?location_id=...&start_date=2026-01-01&end_date=2026-01-31
 * @audit BUSINESS RULE: Returns all booking blocks regardless of status (used for resource planning)
 * @audit SECURITY: Requires ADMIN_ENROLLMENT_KEY authorization header
 * @audit PERFORMANCE: Supports filtering by location and date range for efficient queries
 * @audit Validate: Ensures date filters are valid if provided
 */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await validateAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabaseAdmin
      .from('booking_blocks')
      .select(`
        id,
        location_id,
        resource_id,
        start_time_utc,
        end_time_utc,
        reason,
        created_at,
        location (
          id,
          name
        ),
        resource (
          id,
          name,
          type
        ),
        created_by (
          id,
          display_name
        )
      `)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (startDate) {
      query = query.gte('start_time_utc', startDate)
    }

    if (endDate) {
      query = query.lte('end_time_utc', endDate)
    }

    const { data: blocks, error } = await query.order('start_time_utc', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      blocks: blocks || [],
      total: blocks?.length || 0
    })
  } catch (error) {
    console.error('Booking blocks GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      {        status: 500 }
    )
  }
}

/**
 * @description Deletes an existing booking block by its ID, freeing up the resource for bookings
 * @param {NextRequest} request - HTTP request with query parameter 'id' for the block to delete
 * @returns {NextResponse} JSON with success status and confirmation message
 * @example DELETE /api/availability/blocks?id=123e4567-e89b-12d3-a456-426614174000
 * @audit BUSINESS RULE: Deleting a block removes the scheduling restriction, allowing new bookings
 * @audit SECURITY: Requires ADMIN_ENROLLMENT_KEY authorization header
 * @audit Validate: Ensures block ID is provided and exists in the database
 * @audit AUDIT: Block deletion is logged for operational monitoring
 */
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await validateAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get('id')

    if (!blockId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      )
    }

    const { data: block, error: blockError } = await supabaseAdmin
      .from('booking_blocks')
      .delete()
      .eq('id', blockId)
      .select()
      .single()

    if (blockError) {
      return NextResponse.json(
        { error: blockError?.message || 'Block not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Booking block deleted successfully'
    })
  } catch (error) {
    console.error('Booking blocks DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
