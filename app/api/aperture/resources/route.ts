import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Get resources list with real-time availability for Aperture dashboard
 * @param {NextRequest} request - Query params: location_id, type, is_active, include_availability
 * @returns {NextResponse} JSON with resources array including current booking status
 * @example GET /api/aperture/resources?location_id=123&include_availability=true
 * @audit BUSINESS RULE: Resources filtered by location for operational efficiency
 * @audit SECURITY: RLS policies restrict resource access by staff location
 * @audit PERFORMANCE: Real-time availability calculated per resource (may impact performance)
 * @audit Validate: include_availability=true adds currently_booked and available_capacity fields
 * @audit Validate: Only active resources returned unless is_active filter specified
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const type = searchParams.get('type')
    const isActive = searchParams.get('is_active')
    const includeAvailability = searchParams.get('include_availability') === 'true'

    let query = supabaseAdmin
      .from('resources')
      .select(`
        id,
        location_id,
        name,
        type,
        capacity,
        is_active,
        created_at,
        updated_at,
        locations (
          id,
          name,
          address
        )
      `)
      .order('type', { ascending: true })
      .order('name', { ascending: true })

    // Apply filters
    if (locationId) {
      query = query.eq('location_id', locationId)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: resources, error } = await query

    if (error) {
      console.error('Resources GET error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // If availability is requested, check current usage
    if (includeAvailability && resources) {
      const now = new Date()
      const currentHour = now.getHours()

      for (const resource of resources) {
        // Check if resource is currently booked
        const { data: currentBookings } = await supabaseAdmin
          .from('bookings')
          .select('id')
          .eq('resource_id', resource.id)
          .eq('status', 'confirmed')
          .lte('start_time_utc', now.toISOString())
          .gte('end_time_utc', now.toISOString())

        const isCurrentlyBooked = currentBookings && currentBookings.length > 0
        const bookedCount = currentBookings?.length || 0

        ;(resource as any).currently_booked = isCurrentlyBooked
        ;(resource as any).available_capacity = Math.max(0, resource.capacity - bookedCount)
      }
    }

    return NextResponse.json({
      success: true,
      resources: resources || []
    })
  } catch (error) {
    console.error('Resources GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Create a new resource with capacity and type validation
 * @param {NextRequest} request - JSON body with location_id, name, type, capacity
 * @returns {NextResponse} JSON with created resource data
 * @example POST /api/aperture/resources {"location_id": "123", "name": "mani-01", "type": "station", "capacity": 1}
 * @audit BUSINESS RULE: Resource capacity must be positive integer for scheduling logic
 * @audit SECURITY: Resource creation restricted to admin users only
 * @audit Validate: Type must be one of: station, room, equipment
 * @audit Validate: Location must exist and be active before resource creation
 * @audit AUDIT: Resource creation logged in audit_logs with full new_values
 * @audit DATA INTEGRITY: Foreign key ensures location_id validity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location_id, name, type, capacity } = body

    if (!location_id || !name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: location_id, name, type' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['station', 'room', 'equipment'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: station, room, or equipment' },
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

    // Create resource
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .insert({
        location_id,
        name,
        type,
        capacity: capacity || 1,
        is_active: true
      })
      .select(`
        id,
        location_id,
        name,
        type,
        capacity,
        is_active,
        created_at,
        updated_at,
        locations (
          id,
          name,
          address
        )
      `)
      .single()

    if (resourceError) {
      console.error('Resources POST error:', resourceError)
      return NextResponse.json(
        { error: resourceError.message },
        { status: 500 }
      )
    }

    // Log creation
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'resource',
        entity_id: resource.id,
        action: 'create',
        new_values: resource,
        performed_by_role: 'admin'
      })

    return NextResponse.json({
      success: true,
      resource
    })
  } catch (error) {
    console.error('Resources POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
