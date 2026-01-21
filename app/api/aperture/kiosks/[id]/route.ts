import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: kiosk, error } = await supabaseAdmin
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
      .eq('id', params.id)
      .single()

    if (error || !kiosk) {
      return NextResponse.json(
        { error: 'Kiosk not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      kiosk
    })
  } catch (error) {
    console.error('Kiosk GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { device_name, display_name, location_id, ip_address, is_active } = body

    const { data: kiosk, error } = await supabaseAdmin
      .from('kiosks')
      .update({
        device_name,
        display_name,
        location_id,
        ip_address,
        is_active
      })
      .eq('id', params.id)
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
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      kiosk
    })
  } catch (error) {
    console.error('Kiosk PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('kiosks')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kiosk deleted successfully'
    })
  } catch (error) {
    console.error('Kiosk DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
