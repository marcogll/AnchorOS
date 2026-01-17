import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

async function validateAdminOrStaff(request: NextRequest) {
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

/**
 * @description Marks staff as unavailable for a time period
 */
export async function POST(request: NextRequest) {
  try {
    const hasAccess = await validateAdminOrStaff(request)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      staff_id,
      date,
      start_time,
      end_time,
      reason,
      location_id
    } = body

    if (!staff_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: staff_id, date, start_time, end_time' },
        { status: 400 }
      )
    }

    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('id, location_id')
      .eq('id', staff_id)
      .single()

    if (staffError || !staff) {
      return NextResponse.json(
        { error: staffError?.message || 'Staff not found' },
        { status: 400 }
      )
    }

    const { data: availability, error: availabilityError } = await supabaseAdmin.rpc('check_staff_availability', {
      p_staff_id: staff_id,
      p_start_time_utc: `${date}T${start_time}Z`,
      p_end_time_utc: `${date}T${end_time}Z`
    })

    if (availabilityError) {
      return NextResponse.json(
        { error: availabilityError.message },
        { status: 400 }
      )
    }

    const { data: existingAvailability } = await supabaseAdmin
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staff_id)
      .eq('date', date)
      .single()

    if (existingAvailability) {
      return NextResponse.json(
        { error: 'Availability already exists for this staff and date' },
        { status: 400 }
      )
    }

    const { data: newAvailability, error: createError } = await supabaseAdmin
      .from('staff_availability')
      .insert({
        staff_id,
        date,
        start_time,
        end_time,
        is_available: false,
        reason,
        created_by: staff_id
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      availability: newAvailability
    })
  } catch (error) {
    console.error('Staff unavailable POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Retrieves staff unavailability records
 */
export async function GET(request: NextRequest) {
  try {
    const hasAccess = await validateAdminOrStaff(request)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staff_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!staffId) {
      return NextResponse.json(
        { error: 'Missing required parameter: staff_id' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staffId)

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: availabilityList, error } = await query.order('date', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      availability: availabilityList || []
    })
  } catch (error) {
    console.error('Staff unavailable GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
