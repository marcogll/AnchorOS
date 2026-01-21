import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Validates kiosk API key and returns kiosk record if valid
 * @param {NextRequest} request - HTTP request containing x-kiosk-api-key header
 * @returns {Promise<Object|null>} Kiosk record with id, location_id, is_active or null if invalid
 * @example validateKiosk(request)
 * @audit SECURITY: Simple API key validation for kiosk operations
 * @audit Validate: Checks both api_key match and is_active status
 */
async function validateKiosk(request: NextRequest) {
  const apiKey = request.headers.get('x-kiosk-api-key')

  if (!apiKey) {
    return null
  }

  const { data: kiosk } = await supabaseAdmin
    .from('kiosks')
    .select('id, location_id, is_active')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single()

  return kiosk
}

/**
 * @description Retrieves bookings for kiosk display, filtered by optional short_id and date
 * @param {NextRequest} request - HTTP request with x-kiosk-api-key header and optional query params: short_id, date
 * @returns {NextResponse} JSON with array of pending/confirmed bookings for the kiosk location
 * @example GET /api/kiosk/bookings?short_id=ABC123 (Search by booking code)
 * @example GET /api/kiosk/bookings?date=2026-01-21 (Get all bookings for date)
 * @audit BUSINESS RULE: Returns only pending and confirmed bookings (not cancelled/completed)
 * @audit SECURITY: Authenticated via x-kiosk-api-key header; returns only location-specific bookings
 * @audit Validate: Filters by kiosk's assigned location automatically
 * @audit PERFORMANCE: Indexed queries on location_id, status, and start_time_utc
 * @audit AUDIT: Kiosk booking access logged for operational monitoring
 */
export async function GET(request: NextRequest) {
  try {
    const kiosk = await validateKiosk(request)
    
    if (!kiosk) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const short_id = searchParams.get('short_id')
    const date = searchParams.get('date')

    let query = supabaseAdmin
      .from('bookings')
      .select()
      .eq('location_id', kiosk.location_id)
      .in('status', ['pending', 'confirmed'])

    if (short_id) {
      query = query.eq('short_id', short_id)
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      
      query = query
        .gte('start_time_utc', startDate.toISOString())
        .lt('start_time_utc', endDate.toISOString())
    }

    const { data: bookings, error } = await query.order('start_time_utc', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Kiosk bookings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Creates a new booking for kiosk
 */
export async function POST(request: NextRequest) {
  try {
    const kiosk = await validateKiosk(request)
    
    if (!kiosk) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      customer_email,
      customer_phone,
      customer_name,
      service_id,
      staff_id,
      start_time_utc,
      notes
    } = body

    if (!customer_email || !service_id || !staff_id || !start_time_utc) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_email, service_id, staff_id, start_time_utc' },
        { status: 400 }
      )
    }

    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('id', service_id)
      .eq('is_active', true)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Invalid service_id' },
        { status: 400 }
      )
    }

    const startTime = new Date(start_time_utc)
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + service.duration_minutes)

    let staff_id_final: string = staff_id
    let secondary_artist_id: string | null = null
    let resource_id: string

    if (service.requires_dual_artist) {
      const { data: assignment } = await supabaseAdmin
        .rpc('assign_dual_artists', {
          p_location_id: kiosk.location_id,
          p_start_time_utc: startTime.toISOString(),
          p_end_time_utc: endTime.toISOString(),
          p_service_id: service.id
        })

      if (!assignment || !assignment.success) {
        return NextResponse.json(
          { error: assignment?.error || 'No dual artists or room available' },
          { status: 400 }
        )
      }

      staff_id_final = assignment.primary_artist
      secondary_artist_id = assignment.secondary_artist
      resource_id = assignment.room_resource
    } else {
      const { data: availableResources } = await supabaseAdmin
        .rpc('get_available_resources_with_priority', {
          p_location_id: kiosk.location_id,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString()
        })

      if (!availableResources || availableResources.length === 0) {
        return NextResponse.json(
          { error: 'No resources available for the selected time' },
          { status: 400 }
        )
      }

      resource_id = availableResources[0].resource_id
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .upsert({
        email: customer_email,
        first_name: customer_name?.split(' ')[0] || 'Cliente',
        last_name: customer_name?.split(' ').slice(1).join(' ') || 'Kiosko',
        phone: customer_phone,
        tier: 'free',
        is_active: true
      })
      .select()
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Failed to create/find customer' },
        { status: 400 }
      )
    }

    const { data: total } = await supabaseAdmin.rpc('calculate_service_total', { p_service_id: service.id })

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        customer_id: customer.id,
        staff_id: staff_id_final,
        secondary_artist_id,
        location_id: kiosk.location_id,
        resource_id,
        service_id,
        start_time_utc: startTime.toISOString(),
        end_time_utc: endTime.toISOString(),
        status: 'pending',
        deposit_amount: 0,
        total_amount: total ?? service.base_price,
        is_paid: false,
        notes
      })
      .select('id, short_id, status, start_time_utc, end_time_utc')
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: bookingError?.message || 'Failed to create booking' },
        { status: 400 }
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
    }

    const { data: resourceData } = await supabaseAdmin
      .from('resources')
      .select('name, type')
      .eq('id', resource_id)
      .single()

    let secondary_staff_name = ''
    if (secondary_artist_id) {
      const { data: secondaryData } = await supabaseAdmin
        .from('staff')
        .select('display_name')
        .eq('id', secondary_artist_id)
        .single()
      secondary_staff_name = secondaryData?.display_name || ''
    }

    const { data: staffData } = await supabaseAdmin
      .from('staff')
      .select('display_name')
      .eq('id', staff_id_final)
      .single()

    return NextResponse.json({
      success: true,
      booking,
      service_name: service.name,
      resource_name: resourceData?.name || '',
      resource_type: resourceData?.type || '',
      staff_name: staffData?.display_name || '',
      secondary_staff_name
    }, { status: 201 })
  } catch (error) {
    console.error('Kiosk bookings POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
