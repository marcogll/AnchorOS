import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Validates kiosk API key and returns kiosk info if valid
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
 * @description FASE 2.2: Creates walk-in booking with dual artist + premium fee support
 * @sprint 2.2 Dual Artists: Auto-assigns primary/secondary artists & room if service.requires_dual_artist
 * @sprint 2.2: total_amount = calculate_service_total(service_id) incl premium
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
      notes
    } = body

    if (!customer_email || !service_id) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_email, service_id' },
        { status: 400 }
      )
    }

    // Validate service exists and is active
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

    // For walk-ins, booking starts immediately
    const startTime = new Date()
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + service.duration_minutes)

    let staff_id: string
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

      staff_id = assignment.primary_artist
      secondary_artist_id = assignment.secondary_artist
      resource_id = assignment.room_resource
    } else {
      const { data: availableStaff } = await supabaseAdmin
        .from('staff')
        .select('id')
        .eq('location_id', kiosk.location_id)
        .eq('is_active', true)
        .in('role', ['artist', 'staff', 'manager'])
        .limit(1)

      if (!availableStaff || availableStaff.length === 0) {
        return NextResponse.json(
          { error: 'No staff available' },
          { status: 400 }
        )
      }

      staff_id = availableStaff[0].id

      const { data: availableResources } = await supabaseAdmin
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

      resource_id = availableResources[0].resource_id
    }

    const { data: customer, error: customerError } = await supabaseAdmin
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

    const { data: total } = await supabaseAdmin.rpc('calculate_service_total', { p_service_id: service.id })

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        customer_id: customer.id,
        staff_id,
        secondary_artist_id,
        location_id: kiosk.location_id,
        resource_id,
        service_id,
        start_time_utc: startTime.toISOString(),
        end_time_utc: endTime.toISOString(),
        status: 'confirmed',
        deposit_amount: 0,
        total_amount: total ?? service.base_price,
        is_paid: false,
        notes: notes ? `${notes} [Walk-in]` : '[Walk-in]'
      })
      .select('id, status, start_time_utc, end_time_utc, total_amount, is_paid')
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: bookingError?.message || 'Failed to create walk-in booking' },
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

      const { data: staffData } = await supabaseAdmin
        .from('staff')
        .select('display_name')
        .eq('id', staff_id)
        .single()

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

      return NextResponse.json({
        success: true,
        booking,
        service_name: service.name,
        resource_name: resourceData?.name || '',
        resource_type: resourceData?.type || '',
        staff_name: staffData?.display_name || '',
        secondary_staff_name,
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
