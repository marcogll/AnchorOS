import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

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
 * @description Confirms a pending booking by short ID for kiosk
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { shortId: string } }
) {
  try {
    const kiosk = await validateKiosk(request)
    
    if (!kiosk) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const shortId = params.shortId

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, status, location_id')
      .eq('short_id', shortId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.location_id !== kiosk.location_id) {
      return NextResponse.json(
        { error: 'Booking not found in kiosk location' },
        { status: 404 }
      )
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'Booking is not in pending status' },
        { status: 400 }
      )
    }

    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', booking.id)
      .select('id, short_id, status, start_time_utc, end_time_utc')
      .single()

    if (updateError || !updatedBooking) {
      return NextResponse.json(
        { error: updateError?.message || 'Failed to confirm booking' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking
    })
  } catch (error) {
    console.error('Kiosk booking confirm error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
