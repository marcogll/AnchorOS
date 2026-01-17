import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * @description Retrieves staff availability schedule with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const staffId = searchParams.get('staff_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabaseAdmin
      .from('staff_availability')
      .select('*')
      .order('date', { ascending: true })

    if (locationId) {
      const { data: locationStaff } = await supabaseAdmin
        .from('staff')
        .select('id, display_name')
        .eq('location_id', locationId)
        .eq('is_active', true)

      if (locationStaff && locationStaff.length > 0) {
        query = query.in('staff_id', locationStaff.map(s => s.id))
      }
    }

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: availability, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      availability: availability || []
    })
  } catch (error) {
    console.error('Aperture staff schedule GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Creates or updates staff availability
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      staff_id,
      date,
      start_time,
      end_time,
      is_available,
      reason
    } = body

    if (!staff_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: staff_id, date, start_time, end_time' },
        { status: 400 }
      )
    }

    const { data: existing, error: checkError } = await supabaseAdmin
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staff_id)
      .eq('date', date)
      .single()

    if (existing && !is_available) {
      await supabaseAdmin
        .from('staff_availability')
        .update({
          start_time,
          end_time,
          is_available,
          reason
        })
        .eq('staff_id', staff_id)
        .eq('date', date)
        .single()

      return NextResponse.json({
        success: true,
        availability: existing
      })
    }

    if (checkError) {
      return NextResponse.json(
        { error: checkError.message },
        { status: 500 }
      )
    }

    const { data: availability, error } = await supabaseAdmin
      .from('staff_availability')
      .insert({
        staff_id,
        date,
        start_time,
        end_time,
        is_available,
        reason
      })
      .select()
      .single()

    if (error || !availability) {
      return NextResponse.json(
        { error: error?.message || 'Failed to create staff availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      availability
    }, { status: 201 })
  } catch (error) {
    console.error('Aperture staff schedule POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Deletes staff availability by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('staff_availability')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Staff availability deleted successfully'
    })
  } catch (error) {
    console.error('Aperture staff schedule DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
