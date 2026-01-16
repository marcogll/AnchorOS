import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

async function validateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  
  if (token !== process.env.ADMIN_ENROLLMENT_KEY) {
    return null
  }

  return true
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await validateAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const isActive = searchParams.get('is_active')

    let query = supabaseAdmin
      .from('kiosks')
      .select(`
        id,
        location_id,
        device_name,
        display_name,
        ip_address,
        is_active,
        created_at,
        updated_at,
        location (
          id,
          name,
          timezone
        )
      `)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: kiosks, error: kiosksError } = await query.order('created_at', { ascending: false })

    if (kiosksError) {
      return NextResponse.json(
        { error: kiosksError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ kiosks })
  } catch (error) {
    console.error('Admin kiosks GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await validateAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      location_id,
      device_name,
      display_name,
      ip_address
    } = body

    if (!location_id || !device_name || !display_name) {
      return NextResponse.json(
        { error: 'Missing required fields: location_id, device_name, display_name' },
        { status: 400 }
      )
    }

    const { data: existingKiosk } = await supabaseAdmin
      .from('kiosks')
      .select('id')
      .eq('device_name', device_name)
      .single()

    if (existingKiosk) {
      return NextResponse.json(
        { error: 'A kiosk with this device_name already exists' },
        { status: 400 }
      )
    }

    const { data: kiosk, error: kioskError } = await supabaseAdmin.rpc('create_kiosk', {
      p_location_id: location_id,
      p_device_name: device_name,
      p_display_name: display_name,
      p_ip_address: ip_address
    })

    if (kioskError || !kiosk) {
      return NextResponse.json(
        { error: kioskError?.message || 'Failed to create kiosk' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      kiosk,
      message: 'Kiosk created successfully. Save the API key securely.'
    }, { status: 201 })
  } catch (error) {
    console.error('Admin kiosks POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
