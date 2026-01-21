import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateShortId } from '@/lib/utils/short-id'

/**
 * @description Creates a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customer_id,
      customer_email,
      customer_phone,
      customer_first_name,
      customer_last_name,
      service_id,
      location_id,
      start_time_utc,
      notes,
      staff_id
    } = body

    if (!customer_id && (!customer_email || !customer_first_name || !customer_last_name)) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id OR (customer_email, customer_first_name, customer_last_name)' },
        { status: 400 }
      )
    }

    if (!service_id || !location_id || !start_time_utc) {
      return NextResponse.json(
        { error: 'Missing required fields: service_id, location_id, start_time_utc' },
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

    let assignedStaffId: string | null = null

    if (staff_id) {
      const { data: requestedStaff, error: staffError } = await supabaseAdmin
        .from('staff')
        .select('id, display_name')
        .eq('id', staff_id)
        .eq('is_active', true)
        .single()

      if (staffError || !requestedStaff) {
        return NextResponse.json(
          { error: 'Staff member not found or inactive' },
          { status: 404 }
        )
      }

      const { data: staffAvailability, error: availabilityError } = await supabaseAdmin
        .rpc('get_available_staff', {
          p_location_id: location_id,
          p_start_time_utc: start_time_utc,
          p_end_time_utc: endTimeUtc
        })

      if (availabilityError) {
        return NextResponse.json(
          { error: 'Failed to check staff availability' },
          { status: 500 }
        )
      }

      const isStaffAvailable = staffAvailability?.some((s: any) => s.staff_id === staff_id)
      if (!isStaffAvailable) {
        return NextResponse.json(
          { error: 'Selected staff member is not available for the selected time' },
          { status: 409 }
        )
      }

      assignedStaffId = staff_id
    } else {
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

      assignedStaffId = availableStaff[0].staff_id
    }

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

    let customer
    let customerError

    if (customer_id) {
      const result = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('id', customer_id)
        .single()
      customer = result.data
      customerError = result.error
    } else {
      const result = await supabaseAdmin
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
      customer = result.data
      customerError = result.error
    }

    if (customerError || !customer) {
      console.error('Error handling customer:', customerError)
      return NextResponse.json(
        { error: 'Failed to handle customer' },
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
        staff_id: assignedStaffId,
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

    // Send receipt email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/receipts/${booking.id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (emailError) {
      console.error('Failed to send receipt email:', emailError)
      // Don't fail the booking if email fails
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
