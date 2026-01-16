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
      notes
    } = body

    if (!customer_email || !service_id) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_email, service_id' },
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

    const { data: availableStaff } = await supabase
      .from('staff')
      .select('id, display_name, role')
      .eq('location_id', kiosk.location_id)
      .eq('is_active', true)
      .in('role', ['artist', 'staff', 'manager'])

    if (!availableStaff || availableStaff.length === 0) {
      return NextResponse.json(
        { error: 'No staff available' },
        { status: 400 }
      )
    }

    const assignedStaff = availableStaff[0]

    const startTime = new Date()
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
        { error: 'No resources available for immediate booking' },
        { status: 400 }
      )
    }

    const assignedResource = availableResources[0]

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert({
        email: customer_email,
        first_name: customer_name?.split(' ')[0] || 'Cliente',
        last_name: customer_name?.split(' ').slice(1).join(' ') || 'Walk-in',
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
        staff_id: assignedStaff.id,
        location_id: kiosk.location_id,
        resource_id: assignedResource.resource_id,
        service_id,
        start_time_utc: startTime.toISOString(),
        end_time_utc: endTime.toISOString(),
        status: 'confirmed',
        deposit_amount: 0,
        total_amount: service.base_price,
        is_paid: false,
        notes: notes ? `${notes} [Walk-in]` : '[Walk-in]'
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
        { error: bookingError?.message || 'Failed to create walk-in booking' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        resource_name: assignedResource.resource_name,
        resource_type: assignedResource.resource_type,
        staff_name: assignedStaff.display_name
      },
      message: 'Walk-in booking created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Kiosk walk-in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
