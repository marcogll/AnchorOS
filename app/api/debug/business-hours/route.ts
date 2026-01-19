import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Get business hours for all locations (debug endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const { data: locations, error } = await supabaseAdmin
      .from('locations')
      .select('id, name, timezone, business_hours')

    if (error) {
      console.error('Error fetching locations:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      locations
    })
  } catch (error) {
    console.error('Business hours GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}