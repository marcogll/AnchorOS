import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const isActive = searchParams.get('is_active')

    let query = supabaseAdmin
      .from('kiosks')
      .select(`
        id,
        device_name,
        display_name,
        api_key,
        ip_address,
        is_active,
        created_at,
        updated_at,
        location:locations (
          id,
          name,
          address
        )
      `)
      .order('device_name', { ascending: true })

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: kiosks, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      kiosks: kiosks || []
    })
  } catch (error) {
    console.error('Kiosks GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { device_name, display_name, location_id, ip_address } = body

    if (!device_name || !location_id) {
      return NextResponse.json(
        { error: 'Missing required fields: device_name, location_id' },
        { status: 400 }
      )
    }

    const { data: location, error: locationError } = await supabaseAdmin
      .from('locations')
      .select('id')
      .eq('id', location_id)
      .single()

    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    const { data: kiosk, error } = await supabaseAdmin
      .from('kiosks')
      .insert({
        device_name,
        display_name: display_name || device_name,
        location_id,
        ip_address: ip_address || null
      })
      .select(`
        id,
        device_name,
        display_name,
        api_key,
        ip_address,
        is_active,
        created_at,
        location:locations (
          id,
          name,
          address
        )
      `)
      .single()

    if (error) {
      console.error('Error creating kiosk:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      kiosk
    }, { status: 201 })
  } catch (error) {
    console.error('Kiosks POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
