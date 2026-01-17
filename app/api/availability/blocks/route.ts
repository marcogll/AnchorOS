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

/**
 * @description Creates a booking block for a resource
 */
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
      resource_id,
      start_time_utc,
      end_time_utc,
      reason
    } = body

    if (!location_id || !resource_id || !start_time_utc || !end_time_utc) {
      return NextResponse.json(
        { error: 'Missing required fields: location_id, resource_id, start_time_utc, end_time_utc' },
        { status: 400 }
      )
    }

    const { data: block, error: blockError } = await supabaseAdmin
      .from('booking_blocks')
      .insert({
        location_id,
        resource_id,
        start_time_utc,
        end_time_utc,
        reason
      })
      .select()
      .single()

    if (blockError || !block) {
      return NextResponse.json(
        { error: blockError?.message || 'Failed to create booking block' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      block
    })
  } catch (error) {
    console.error('Booking blocks POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Retrieves booking blocks with filters
 */
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
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabaseAdmin
      .from('booking_blocks')
      .select(`
        id,
        location_id,
        resource_id,
        start_time_utc,
        end_time_utc,
        reason,
        created_at,
        location (
          id,
          name
        ),
        resource (
          id,
          name,
          type
        ),
        created_by (
          id,
          display_name
        )
      `)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (startDate) {
      query = query.gte('start_time_utc', startDate)
    }

    if (endDate) {
      query = query.lte('end_time_utc', endDate)
    }

    const { data: blocks, error } = await query.order('start_time_utc', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      blocks: blocks || [],
      total: blocks?.length || 0
    })
  } catch (error) {
    console.error('Booking blocks GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      {        status: 500 }
    )
  }
}

/**
 * @description Deletes a booking block by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await validateAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get('id')

    if (!blockId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      )
    }

    const { data: block, error: blockError } = await supabaseAdmin
      .from('booking_blocks')
      .delete()
      .eq('id', blockId)
      .select()
      .single()

    if (blockError) {
      return NextResponse.json(
        { error: blockError?.message || 'Block not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Booking block deleted successfully'
    })
  } catch (error) {
    console.error('Booking blocks DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
