import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { generateShortId } from '@/lib/utils/short-id'

/**
 * @description Creates a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customer_email,
      customer_phone,
      customer_first_name,
      customer_last_name,
      service_id,
      location_id,
      start_time_utc,
      notes
    } = body

    if (!customer_email || !service_id || !location_id || !start_time_utc) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_email, service_id, location_id, start_time_utc' },
        { status: 400 }
      )
    }

    const startTime = new Date(start_time_utc)
    
    if (isNaN(startTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start_time_utc format' },
        { status: 400 }
      )
    }

    const { data: location, error: locationError } = await supabaseAdmin
      .from('locations')
      .select('id, name, timezone')
      .eq('id', location_id)
      .single()

    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('*, location_id')
      .eq('id', service_id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (service.location_id !== location_id) {
      return NextResponse.json(
        { error: 'Service does not belong to the specified location' },
        { status: 400 }
      )
    }

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + service.duration_minutes)

    const endTimeUtc = endTime.toISOString()

    // Check staff availability for the requested time slot
    const { data: availableStaff, error: staffError } = await supabaseAdmin.rpc('get_available_staff', {
      p_location_id: location_id,
      p_start_time_utc: start_time_utc,
      p_end_time_utc: endTimeUtc
    })

    if (staffError) {
      console.error('Error checking staff availability:', staffError)
      return NextResponse.json(
        { error: 'Failed to check staff availability' },
        { status: 500 }
      )
    }

    if (!availableStaff || availableStaff.length === 0) {
      return NextResponse.json(
        { error: 'No staff available for the selected time' },
        { status: 409 }
      )
    }

    const assignedStaff = availableStaff[0]

    // Check resource availability with service priority
    const { data: availableResources, error: resourcesError } = await supabaseAdmin.rpc('get_available_resources_with_priority', {
      p_location_id: location_id,
      p_start_time: start_time_utc,
      p_end_time: endTimeUtc,
      p_service_id: service_id
    })

    if (resourcesError) {
      console.error('Error checking resource availability:', resourcesError)
      return NextResponse.json(
        { error: 'Failed to check resource availability' },
        { status: 500 }
      )
    }

    if (!availableResources || availableResources.length === 0) {
      return NextResponse.json(
        { error: 'No resources available for the selected time' },
        { status: 409 }
      )
    }

    const assignedResource = availableResources[0]

    // Create or find customer based on email
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .upsert({
        email: customer_email,
        phone: customer_phone || null,
        first_name: customer_first_name || null,
        last_name: customer_last_name || null
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (customerError || !customer) {
      console.error('Error creating customer:', customerError)
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      )
    }

    const shortId = await generateShortId()

    // Create the booking record with all assigned resources
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        customer_id: customer.id,
        service_id,
        location_id,
        staff_id: assignedStaff.staff_id,
        resource_id: assignedResource.resource_id,
        short_id: shortId,
        status: 'pending',
        start_time_utc: start_time_utc,
        end_time_utc: endTimeUtc,
        is_paid: false,
        notes
      })
      .select(`
        id,
        short_id,
        status,
        start_time_utc,
        end_time_utc,
        notes,
        service (
          id,
          name,
          duration_minutes,
          base_price
        ),
        resource (
          id,
          name,
          type
        ),
        staff (
          id,
          display_name
        ),
        location (
          id,
          name,
          address,
          timezone
        )
      `)
      .single()

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { error: bookingError?.message || 'Failed to create booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      booking
    }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Retrieves bookings with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id')
    const shortId = searchParams.get('short_id')
    const locationId = searchParams.get('location_id')
    const status = searchParams.get('status')

    if (!customerId && !shortId && !locationId) {
      return NextResponse.json(
        { error: 'At least one of customer_id, short_id, or location_id is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        short_id,
        status,
        start_time_utc,
        end_time_utc,
        notes,
        is_paid,
        created_at,
        service (
          id,
          name,
          duration_minutes,
          base_price,
          category
        ),
        resource (
          id,
          name,
          type
        ),
        staff (
          id,
          display_name
        ),
        location (
          id,
          name,
          address,
          timezone
        ),
        customer (
          id,
          email,
          first_name,
          last_name,
          phone
        )
      `)

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (!shortId) {
      query = query.order('start_time_utc', { ascending: false })
    }

    const { data: bookings, error } = shortId 
      ? await query.eq('short_id', shortId).single()
      : await query

    if (error) {
      console.error('Bookings GET error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (shortId && (!bookings || (Array.isArray(bookings) && bookings.length === 0))) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      bookings: shortId ? [bookings] : (bookings || [])
    })
  } catch (error) {
    console.error('Bookings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
