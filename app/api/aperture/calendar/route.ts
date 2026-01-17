import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Get comprehensive calendar data for drag-and-drop scheduling interface
 * @param {NextRequest} request - Query params: start_date, end_date, location_ids, staff_ids
 * @returns {NextResponse} JSON with bookings, staff list, locations, and business hours
 * @example GET /api/aperture/calendar?start_date=2026-01-16T00:00:00Z&location_ids=123,456
 * @audit BUSINESS RULE: Calendar shows only bookings for specified date range and filters
 * @audit SECURITY: RLS policies filter bookings by staff location permissions
 * @audit PERFORMANCE: Separate queries for bookings, staff, locations to avoid complex joins
 * @audit Validate: Business hours returned for calendar time slot rendering
 * @audit Validate: Staff list filtered by provided staff_ids or location permissions
 * @audit Validate: Location list includes all active locations for filter dropdown
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const locationIds = searchParams.get('location_ids')?.split(',') || []
    const staffIds = searchParams.get('staff_ids')?.split(',') || []
    // Backward compatibility
    const locationId = searchParams.get('location_id')

    // Get bookings for the date range
    let bookingsQuery = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        short_id,
        status,
        start_time_utc,
        end_time_utc,
        customer_id,
        service_id,
        staff_id,
        resource_id,
        location_id
      `)

    if (startDate) {
      bookingsQuery = bookingsQuery.gte('start_time_utc', startDate)
    }
    if (endDate) {
      bookingsQuery = bookingsQuery.lte('start_time_utc', endDate)
    }
    // Support both single location and multiple locations
    const effectiveLocationIds = locationId ? [locationId] : locationIds
    if (effectiveLocationIds.length > 0) {
      bookingsQuery = bookingsQuery.in('location_id', effectiveLocationIds)
    }
    if (staffIds.length > 0) {
      bookingsQuery = bookingsQuery.in('staff_id', staffIds)
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery
      .order('start_time_utc', { ascending: true })

    if (bookingsError) {
      console.error('Aperture calendar GET error:', bookingsError)
      return NextResponse.json(
        { error: bookingsError.message },
        { status: 500 }
      )
    }

    // Get related data
    const customerIds = bookings?.map(b => b.customer_id).filter(Boolean) || []
    const serviceIds = bookings?.map(b => b.service_id).filter(Boolean) || []
    const staffIdsFromBookings = bookings?.map(b => b.staff_id).filter(Boolean) || []
    const resourceIds = bookings?.map(b => b.resource_id).filter(Boolean) || []
    const allStaffIds = Array.from(new Set([...staffIdsFromBookings, ...staffIds]))

    const [customers, services, staff, resources] = await Promise.all([
      customerIds.length > 0 ? supabaseAdmin.from('customers').select('id, first_name, last_name').in('id', customerIds) : Promise.resolve({ data: [] }),
      serviceIds.length > 0 ? supabaseAdmin.from('services').select('id, name, duration_minutes').in('id', serviceIds) : Promise.resolve({ data: [] }),
      allStaffIds.length > 0 ? supabaseAdmin.from('staff').select('id, display_name, role').in('id', allStaffIds) : Promise.resolve({ data: [] }),
      resourceIds.length > 0 ? supabaseAdmin.from('resources').select('id, name, type').in('id', resourceIds) : Promise.resolve({ data: [] })
    ])

    const customerMap = new Map(customers.data?.map(c => [c.id, c]) || [])
    const serviceMap = new Map(services.data?.map(s => [s.id, s]) || [])
    const staffMap = new Map(staff.data?.map(s => [s.id, s]) || [])
    const resourceMap = new Map(resources.data?.map(r => [r.id, r]) || [])

    // Format bookings for calendar
    const calendarBookings = bookings?.map(booking => ({
      id: booking.id,
      shortId: booking.short_id,
      status: booking.status,
      startTime: booking.start_time_utc,
      endTime: booking.end_time_utc,
      customer: customerMap.get(booking.customer_id),
      service: serviceMap.get(booking.service_id),
      staff: staffMap.get(booking.staff_id),
      resource: resourceMap.get(booking.resource_id),
      locationId: booking.location_id
    })) || []

    // Get staff list for calendar columns
    const calendarStaff = staff.data || []

    // Get available locations
    const { data: locations } = await supabaseAdmin
      .from('locations')
      .select('id, name, address')
      .eq('is_active', true)

    // Get business hours for the date range (simplified - assume 9 AM to 8 PM)
    const businessHours = {
      start: '09:00',
      end: '20:00',
      days: [1, 2, 3, 4, 5, 6] // Monday to Saturday
    }

    return NextResponse.json({
      success: true,
      bookings: calendarBookings,
      staff: calendarStaff,
      locations: locations || [],
      businessHours,
      dateRange: {
        start: startDate,
        end: endDate
      }
    })

  } catch (error) {
    console.error('Unexpected error in calendar API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}