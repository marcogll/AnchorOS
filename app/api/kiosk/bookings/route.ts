import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

async function validateKiosk(request: NextRequest) {
  const apiKey = request.headers.get('x-kiosk-api-key')
  
  if (!apiKey) {
    return null
  }

  const { data: kiosk } = await supabase
    .from('kiosks')
    .select('id, location_id, is_active')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single()

  return kiosk
}

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

    let query = supabase
      .from('bookings')
      .select(`
        id,
        short_id,
        status,
        start_time_utc,
        end_time_utc,
        service (
          id,
          name,
          duration_minutes
        ),
        resource (
          id,
          name,
          type
        ),
        staff (
          id,
          display_name
        )
      `)
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

    const { data: service, error: serviceError } = await supabase
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

    const { data: availableResources } = await supabase
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

    const assignedResource = availableResources[0]

    const { data: customer, error: customerError } = await supabase
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

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_id: customer.id,
        staff_id,
        location_id: kiosk.location_id,
        resource_id: assignedResource.resource_id,
        service_id,
        start_time_utc: startTime.toISOString(),
        end_time_utc: endTime.toISOString(),
        status: 'pending',
        deposit_amount: 0,
        total_amount: service.base_price,
        is_paid: false,
        notes
      })
      .select(`
        id,
        short_id,
        status,
        start_time_utc,
        end_time_utc,
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
        )
      `)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: bookingError?.message || 'Failed to create booking' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        resource_name: assignedResource.resource_name,
        resource_type: assignedResource.resource_type
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Kiosk bookings POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
